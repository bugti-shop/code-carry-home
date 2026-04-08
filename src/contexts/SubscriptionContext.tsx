import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { getSetting, setSetting } from '@/utils/settingsStorage';
import { getStoredGoogleUser } from '@/utils/googleAuth';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';
import {
  Purchases,
  LOG_LEVEL,
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  PACKAGE_TYPE,
  PAYWALL_RESULT,
  PurchasesCallbackId
} from '@revenuecat/purchases-capacitor';
import { RevenueCatUI } from '@revenuecat/purchases-capacitor-ui';

// RevenueCat API Key - This is a public key safe to include in the app
const REVENUECAT_API_KEY = 'goog_WLSvWlyHHLzNAgIfhCzAYsGaZyh';

// Entitlement identifier
const ENTITLEMENT_ID = 'npd Pro';

// Product identifiers
const PRODUCT_IDS = {
  weekly: 'nnppd_weekly:nnnpd-weekly',
  monthly: 'npd_mo:npd-mo',
  yearly: 'npd_yr:npd-yearly-plan',
} as const;

// Free trial offer IDs (base plan:offer)
const TRIAL_OFFER_IDS: Partial<Record<ProductType, string>> = {
  monthly: 'npd-monthly-offer',
  yearly: 'npd-yearly-trial',
};

export type ProductType = keyof typeof PRODUCT_IDS;
export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionPlanType = 'none' | 'weekly' | 'monthly' | 'yearly';

// All premium features list
export const PREMIUM_FEATURES = [
  'linkedin_formatter',
  'note_templates',
  'app_lock',
  'notes_type_visibility',
  'notes_settings',
  'tasks_settings',
  'quick_add',
  'multiple_tasks',
  'location_reminders',
  'task_status',
  'view_mode_status_board',
  'view_mode_timeline',
  'view_mode_progress',
  'view_mode_priority',
  'view_mode_history',
  'dark_mode',
  'smart_lists',
  'time_tracking',
  'extract_features',
  'backup',
  'deadline_escalation',
  'deadline',
  'pin_feature',
  'extra_folders',
  'extra_sections',
  'file_attachments',
  'customize_navigation',
  'sketch',
  'sketch_collab',
  'urgent_reminder',
  'team_collaboration',
] as const;

// No features are restricted to specific plan types - all premium features available to all plans
export const RECURRING_ONLY_FEATURES: readonly PremiumFeature[] = [] as const;

export type PremiumFeature = typeof PREMIUM_FEATURES[number];

// No free limits — hard paywall with free trial grants full access
export const FREE_LIMITS = {
  maxNoteFolders: Infinity,
  maxTaskFolders: Infinity,
  maxTaskSections: Infinity,
  maxNotes: Infinity,
};

interface UnifiedBillingContextType {
  // Subscription state
  tier: SubscriptionTier;
  planType: SubscriptionPlanType;
  isPro: boolean;
  isRecurringSubscriber: boolean;
  isLoading: boolean;
  isLocalTrial: boolean;
  localTrialExpired: boolean;
  graceExpired: boolean;
  checkStripeByEmail: (email: string) => Promise<boolean>;
  
  // Feature gating
  showPaywall: boolean;
  isVerifyingCheckout: boolean;
  checkoutVerificationFailed: boolean;
  paywallFeature: string | null;
  openPaywall: (feature?: string) => void;
  closePaywall: () => void;
  canUseFeature: (feature: PremiumFeature) => boolean;
  requireFeature: (feature: PremiumFeature) => boolean;
  unlockPro: () => Promise<void>;

  // RevenueCat state
  isInitialized: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  error: string | null;

  // RevenueCat actions
  initialize: (appUserID?: string) => Promise<void>;
  checkEntitlement: () => Promise<boolean>;
  getOfferings: () => Promise<PurchasesOfferings | null>;
  purchase: (productType: ProductType) => Promise<boolean>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  presentPaywall: () => Promise<PAYWALL_RESULT>;
  presentPaywallIfNeeded: () => Promise<PAYWALL_RESULT>;
  presentCustomerCenter: () => Promise<void>;
  logout: () => Promise<void>;
}

const UnifiedBillingContext = createContext<UnifiedBillingContextType | undefined>(undefined);

// Free trial duration in days
const FREE_TRIAL_DAYS = 8;
const GRACE_PERIOD_DAYS = 3;
const SIGNOUT_GRACE_MS = 24 * 60 * 60 * 1000; // 1 day after sign-out

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  // Local state
  const [localProAccess, setLocalProAccess] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  // On web: if user was previously verified as subscribed, trust local cache instantly
  // and verify silently in background — no paywall flash for returning subscribers
  const [showPaywall, setShowPaywall] = useState(() => {
    if (Capacitor.isNativePlatform()) return false;
    try {
      // If previously verified as subscribed, don't show paywall on mount
      if (localStorage.getItem('flowist_stripe_subscribed') === 'true') return false;
    } catch {}
    return true;
  });
  const [paywallFeature, setPaywallFeature] = useState<string | null>(null);
  const [isLocalTrial, setIsLocalTrial] = useState(false);
  const [localTrialExpired, setLocalTrialExpired] = useState(false);
  const [graceExpired, setGraceExpired] = useState(false);
  const [signoutGraceActive, setSignoutGraceActive] = useState(false);

  // RevenueCat state
  // If native user was previously entitled, mark as initialized immediately for offline-first access
  const [isInitialized, setIsInitialized] = useState(() => {
    if (Capacitor.isNativePlatform()) {
      try { return localStorage.getItem('flowist_rc_entitled') === 'true'; } catch {}
    }
    return false;
  });
  const [rcLoading, setRcLoading] = useState(false);
  // Initialize rcIsPro from local cache for instant access on both web and native
  const [rcIsPro, setRcIsPro] = useState(() => {
    try {
      if (!Capacitor.isNativePlatform()) {
        return localStorage.getItem('flowist_stripe_subscribed') === 'true';
      }
      // On native, trust cached RC entitlement until RC verifies
      return localStorage.getItem('flowist_rc_entitled') === 'true';
    } catch {}
    return false;
  });
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listenerHandle, setListenerHandle] = useState<PurchasesCallbackId | null>(null);
  const [isAdminBypass, setIsAdminBypass] = useState(false);
  // If locally cached as subscribed, mark as resolved immediately to avoid loading state
  const [isWebSubscriptionResolved, setIsWebSubscriptionResolved] = useState(() => {
    if (Capacitor.isNativePlatform()) return true;
    try {
      if (localStorage.getItem('flowist_stripe_subscribed') === 'true') return true;
    } catch {}
    return false;
  });
  const [isVerifyingCheckout, setIsVerifyingCheckout] = useState(false);
  const [checkoutVerificationFailed, setCheckoutVerificationFailed] = useState(false);

  // Check sign-out grace period on mount
  useEffect(() => {
    const checkSignoutGrace = async () => {
      try {
        const signoutTs = await getSetting<number>('flowist_signout_grace_ts', 0);
        if (signoutTs > 0 && Date.now() - signoutTs < SIGNOUT_GRACE_MS) {
          console.log('[Grace] Sign-out grace period active — user can use app without sign-in');
          setSignoutGraceActive(true);
        } else if (signoutTs > 0) {
          // Grace expired — clear it
          await setSetting('flowist_signout_grace_ts', 0);
          setSignoutGraceActive(false);
        }
      } catch {}
    };
    checkSignoutGrace();

    // Re-check every 60s in case grace expires while app is open
    const interval = setInterval(async () => {
      try {
        const signoutTs = await getSetting<number>('flowist_signout_grace_ts', 0);
        if (signoutTs > 0 && Date.now() - signoutTs >= SIGNOUT_GRACE_MS) {
          console.log('[Grace] Sign-out grace period expired');
          setSignoutGraceActive(false);
          await setSetting('flowist_signout_grace_ts', 0);
        }
      } catch {}
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Check local 8-day free trial (no credit card required)
  const checkLocalTrial = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      setIsLocalTrial(false);
      setLocalTrialExpired(false);
      setGraceExpired(false);
      return false;
    }

    try {
      const trialStart = await getSetting<number>('flowist_trial_start', 0);
      if (!trialStart) {
        setIsLocalTrial(false);
        setLocalTrialExpired(false);
        return false;
      }
      const now = Date.now();
      const elapsed = now - trialStart;
      const trialMs = FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000;
      const graceMs = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
      if (elapsed < trialMs) {
        setIsLocalTrial(true);
        setLocalTrialExpired(false);
        setGraceExpired(false);
        return true;
      } else if (elapsed < trialMs + graceMs) {
        // In grace period — trial expired but still within grace
        setIsLocalTrial(false);
        setLocalTrialExpired(true);
        setGraceExpired(false);
        return true; // still grant access during grace
      } else {
        setIsLocalTrial(false);
        setLocalTrialExpired(true);
        setGraceExpired(true);
        return false;
      }
    } catch {
      return false;
    }
  }, []);

  // Load local admin bypass + trial on mount + listen for activation
  useEffect(() => {
    const loadLocal = async () => {
      try {
        const adminBypass = await getSetting<boolean>('flowist_admin_bypass', false);
        setLocalProAccess(!!adminBypass);
        setIsAdminBypass(!!adminBypass);
        if (Capacitor.isNativePlatform()) {
          setIsLocalTrial(false);
          setLocalTrialExpired(false);
          setGraceExpired(false);
          await setSetting('flowist_trial_start', 0);
        }
        // Check local free trial
        const trialActive = await checkLocalTrial();
        if (trialActive && !adminBypass) {
          setLocalProAccess(true);
        }
      } catch (e) {
        console.error('Failed to load subscription:', e);
      } finally {
        setLocalLoading(false);
      }
    };
    loadLocal();

    // Listen for admin bypass activation from OnboardingFlow or elsewhere
    const handleAdminBypass = () => {
      setLocalProAccess(true);
      setIsAdminBypass(true);
    };
    window.addEventListener('adminBypassActivated', handleAdminBypass);

    // Listen for trial start (set when onboarding completes)
    const handleTrialStart = () => {
      if (Capacitor.isNativePlatform()) return;
      setLocalProAccess(true);
      setIsLocalTrial(true);
      setLocalTrialExpired(false);
    };
    window.addEventListener('flowistTrialStarted', handleTrialStart);

    // Periodically check trial expiry (every 60s)
    const trialInterval = setInterval(async () => {
      const stillActive = await checkLocalTrial();
      if (!stillActive && !isAdminBypass) {
        // Trial expired — will be handled by App.tsx
      }
    }, 60000);

    return () => {
      window.removeEventListener('adminBypassActivated', handleAdminBypass);
      window.removeEventListener('flowistTrialStarted', handleTrialStart);
      clearInterval(trialInterval);
    };
  }, [checkLocalTrial]);

  // On native: clear local bypass if RevenueCat confirms no active entitlement
  // BUT skip if it's an admin bypass (access code)
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !isInitialized) return;
    if (!rcIsPro && localProAccess && !isAdminBypass) {
      // RevenueCat says no entitlement — clear the local bypass
      console.log('RevenueCat: No active entitlement, clearing local Pro bypass');
      setSetting('flowist_admin_bypass', false).catch(console.error);
      setLocalProAccess(false);
    }
  }, [rcIsPro, isInitialized, localProAccess, isAdminBypass]);

  // ==================== RevenueCat Logic ====================

  const initialize = useCallback(async (userID?: string) => {
    if (!Capacitor.isNativePlatform()) {
      console.log('RevenueCat: Skipping initialization on web platform');
      setIsInitialized(true);
      return;
    }

    try {
      setRcLoading(true);
      setError(null);
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID: userID });

      console.log('RevenueCat: SDK configured successfully');

      const { customerInfo: info } = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      const hasEntitlement = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setRcIsPro(hasEntitlement);
      // Cache entitlement + plan details on native for offline-first access
      try {
        localStorage.setItem('flowist_rc_entitled', hasEntitlement ? 'true' : 'false');
        if (hasEntitlement) {
          const entitlement = info.entitlements.active[ENTITLEMENT_ID];
          if (entitlement?.productIdentifier) {
            localStorage.setItem('flowist_rc_product', entitlement.productIdentifier);
          }
        }
      } catch {}

      const offeringsData = await Purchases.getOfferings();
      setOfferings(offeringsData);

      setIsInitialized(true);
      console.log('RevenueCat: Initialization complete', { isPro: hasEntitlement });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize RevenueCat';
      console.error('RevenueCat: Initialization error', err);
      setError(errorMessage);
      // Offline-first: if RC fails (no network) but cache says entitled, keep access
      try {
        if (localStorage.getItem('flowist_rc_entitled') === 'true') {
          console.log('RevenueCat: Init failed but cached entitlement found — granting offline access');
          setRcIsPro(true);
        }
      } catch {}
      setIsInitialized(true); // Always resolve so isLoading doesn't hang
    } finally {
      setRcLoading(false);
    }
  }, []);

  const checkEntitlement = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const { customerInfo: info } = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      const hasEntitlement = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setRcIsPro(hasEntitlement);
      try { localStorage.setItem('flowist_rc_entitled', hasEntitlement ? 'true' : 'false'); } catch {}
      return hasEntitlement;
    } catch (err) {
      console.error('RevenueCat: Error checking entitlement', err);
      return false;
    }
  }, []);

  const getOfferingsData = useCallback(async (): Promise<PurchasesOfferings | null> => {
    if (!Capacitor.isNativePlatform()) return null;
    try {
      setRcLoading(true);
      const offeringsData = await Purchases.getOfferings();
      setOfferings(offeringsData);
      return offeringsData;
    } catch (err) {
      console.error('RevenueCat: Error fetching offerings', err);
      return null;
    } finally {
      setRcLoading(false);
    }
  }, []);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      setRcLoading(true);
      setError(null);
      const result = await Purchases.purchasePackage({ aPackage: pkg });
      setCustomerInfo(result.customerInfo);
      const hasEntitlement = result.customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setRcIsPro(hasEntitlement);
      console.log('RevenueCat: Purchase successful', { isPro: hasEntitlement });
      return hasEntitlement;
    } catch (err: any) {
      if (err.code === 'PURCHASE_CANCELLED' || err.userCancelled) {
        console.log('RevenueCat: Purchase cancelled by user');
        return false;
      }
      const errorMessage = err instanceof Error ? err.message : 'Purchase failed';
      console.error('RevenueCat: Purchase error', err);
      setError(errorMessage);
      return false;
    } finally {
      setRcLoading(false);
    }
  }, []);

  const purchase = useCallback(async (productType: ProductType): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      console.log('RevenueCat: Purchase not available on web platform');
      return false;
    }
    try {
      setRcLoading(true);
      setError(null);
      const currentOfferings = await Purchases.getOfferings();
      if (!currentOfferings) throw new Error('No offerings available');

      // Collect ALL packages from ALL offerings (current + all named offerings)
      const allPackages: PurchasesPackage[] = [];
      if (currentOfferings.current) {
        allPackages.push(...currentOfferings.current.availablePackages);
      }
      // Also search through all named offerings
      if (currentOfferings.all) {
        Object.values(currentOfferings.all).forEach((offering: any) => {
          if (offering?.availablePackages) {
            offering.availablePackages.forEach((p: PurchasesPackage) => {
              if (!allPackages.find(existing => existing.identifier === p.identifier && existing.product?.identifier === p.product?.identifier)) {
                allPackages.push(p);
              }
            });
          }
        });
      }

      console.log('RevenueCat: All available packages across offerings:', allPackages.map(p => ({
        identifier: p.identifier,
        packageType: p.packageType,
        productIdentifier: p.product?.identifier,
      })));
      console.log('RevenueCat: Looking for productType:', productType, 'with ID:', PRODUCT_IDS[productType]);

      let pkg: any = null;

      const packageTypeMap: Record<ProductType, PACKAGE_TYPE> = {
        weekly: PACKAGE_TYPE.WEEKLY,
        monthly: PACKAGE_TYPE.MONTHLY,
        yearly: PACKAGE_TYPE.ANNUAL,
      };

      const productIdMap: Record<ProductType, string> = {
        weekly: 'nnppd_weekly',
        monthly: 'npd_mo',
        yearly: 'npd_yr',
      };

      // Try finding by package type first, then by product identifier across ALL offerings
      pkg = allPackages.find(p => p.packageType === packageTypeMap[productType])
        || allPackages.find(p => p.product?.identifier === productIdMap[productType])
        || allPackages.find(p => p.product?.identifier?.includes(productIdMap[productType]));

      if (pkg) {
        console.log('RevenueCat: Found package:', pkg.identifier, pkg.product?.identifier);
        return await purchasePackage(pkg);
      }

      // Fallback: purchase directly via store product if not in offerings
      console.log('RevenueCat: Package not found in offerings, trying direct product purchase for:', productIdMap[productType]);
      const fullProductId = PRODUCT_IDS[productType];
      const { products } = await Purchases.getProducts({ 
        productIdentifiers: [productIdMap[productType], fullProductId] 
      });
      console.log('RevenueCat: Found store products:', products.map(p => p.identifier));

      const storeProduct = products.find(p => p.identifier === productIdMap[productType])
        || products.find(p => p.identifier === fullProductId)
        || products[0];

      if (!storeProduct) {
        console.error('RevenueCat: No product found. Tried:', productIdMap[productType], fullProductId);
        throw new Error(`Product not found for ${productType}. Make sure it's added to RevenueCat and Google Play.`);
      }

      console.log('RevenueCat: Purchasing store product directly:', storeProduct.identifier);
      
      // Try to apply free trial offer if available
      const trialOfferId = TRIAL_OFFER_IDS[productType];
      const purchaseOptions: any = { product: storeProduct };
      if (trialOfferId && (storeProduct as any).subscriptionOptions) {
        const trialOption = (storeProduct as any).subscriptionOptions?.find(
          (opt: any) => opt.id?.includes(trialOfferId)
        );
        if (trialOption) {
          purchaseOptions.subscriptionOption = trialOption;
          console.log('RevenueCat: Applying trial offer:', trialOfferId);
        }
      }
      
      const result = await Purchases.purchaseStoreProduct(purchaseOptions);
      setCustomerInfo(result.customerInfo);
      const hasEntitlement = result.customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setRcIsPro(hasEntitlement);
      return hasEntitlement;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Purchase failed';
      console.error('RevenueCat: Purchase error', err);
      setError(errorMessage);
      return false;
    } finally {
      setRcLoading(false);
    }
  }, [purchasePackage]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      setRcLoading(true);
      setError(null);
      const { customerInfo: info } = await Purchases.restorePurchases();
      setCustomerInfo(info);
      const hasEntitlement = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setRcIsPro(hasEntitlement);
      console.log('RevenueCat: Restore successful', { isPro: hasEntitlement });
      return hasEntitlement;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Restore failed';
      console.error('RevenueCat: Restore error', err);
      setError(errorMessage);
      return false;
    } finally {
      setRcLoading(false);
    }
  }, []);

  const presentPaywallRC = useCallback(async (): Promise<PAYWALL_RESULT> => {
    if (!Capacitor.isNativePlatform()) {
      console.log('RevenueCat: Paywall not available on web platform');
      return PAYWALL_RESULT.NOT_PRESENTED;
    }
    try {
      setRcLoading(true);
      const { result } = await RevenueCatUI.presentPaywall();
      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        await checkEntitlement();
      }
      return result;
    } catch (err) {
      console.error('RevenueCat: Paywall error', err);
      return PAYWALL_RESULT.ERROR;
    } finally {
      setRcLoading(false);
    }
  }, [checkEntitlement]);

  const presentPaywallIfNeeded = useCallback(async (): Promise<PAYWALL_RESULT> => {
    if (!Capacitor.isNativePlatform()) {
      return PAYWALL_RESULT.NOT_PRESENTED;
    }
    try {
      setRcLoading(true);
      const { result } = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
      });
      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        await checkEntitlement();
      }
      return result;
    } catch (err) {
      console.error('RevenueCat: Paywall error', err);
      return PAYWALL_RESULT.ERROR;
    } finally {
      setRcLoading(false);
    }
  }, [checkEntitlement]);

  const presentCustomerCenter = useCallback(async (): Promise<void> => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await RevenueCatUI.presentCustomerCenter();
      await checkEntitlement();
    } catch (err) {
      console.error('RevenueCat: Customer Center error', err);
    }
  }, [checkEntitlement]);

  const logout = useCallback(async (): Promise<void> => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Purchases.logOut();
      setCustomerInfo(null);
      setRcIsPro(false);
      try { localStorage.removeItem('flowist_rc_entitled'); } catch {}
      console.log('RevenueCat: Logged out, subscription disassociated');
    } catch (err) {
      console.error('RevenueCat: Logout error', err);
    }
  }, []);

  const hasVerifiedStripeAccess = useCallback((data: any) => {
    const status = data?.subscription_status;
    return Boolean(data?.subscribed || status === 'active' || status === 'trialing' || status === 'past_due');
  }, []);

  // Check Stripe subscription on web — silently in background
  // Never flashes paywall for returning subscribers; trusts local cache until server says otherwise
  const checkStripeSubscription = useCallback(async () => {
    if (Capacitor.isNativePlatform()) return;
    
    // Don't reset isWebSubscriptionResolved if we already have a cached result
    // This prevents the loading/paywall flash on refresh
    const wasCached = (() => {
      try { return localStorage.getItem('flowist_stripe_subscribed') === 'true'; } catch { return false; }
    })();
    if (!wasCached) {
      setIsWebSubscriptionResolved(false);
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const storedEmail = (() => {
        try {
          return localStorage.getItem('flowist_stripe_customer_email')?.trim() || null;
        } catch {
          return null;
        }
      })();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      if (!session?.access_token && !storedEmail) {
        if (!isAdminBypass && !wasCached) {
          setRcIsPro(false);
          setShowPaywall(true);
        }
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers,
        body: !session?.access_token && storedEmail ? { email: storedEmail } : undefined,
      });
      
      if (error) {
        console.error('Stripe check-subscription error:', error);
        // On error, don't revoke access for cached subscribers — fail open
        return;
      }
      
      if (hasVerifiedStripeAccess(data)) {
        setRcIsPro(true);
        if (data.plan_type) {
          (window as any).__stripePlanType = data.plan_type;
          (window as any).__stripeIsTrialing = data.is_trialing || false;
        }
        if (data.customer_email) {
          try { localStorage.setItem('flowist_stripe_customer_email', data.customer_email); } catch {}
        }
        try { localStorage.setItem('flowist_stripe_subscribed', 'true'); } catch {}
        try { localStorage.setItem('flowist_trial_used', 'true'); } catch {}
        // Cache plan details for offline-first access
        try {
          if (data.plan_type) localStorage.setItem('flowist_stripe_plan', data.plan_type);
          localStorage.setItem('flowist_stripe_trialing', data.is_trialing ? 'true' : 'false');
          localStorage.setItem('flowist_sub_verified_at', String(Date.now()));
        } catch {}
        setShowPaywall(false);
        setPaywallFeature(null);
      } else {
        // Server confirmed no subscription — only revoke if verification is recent (not stale network error)
        if (!isAdminBypass) {
          setRcIsPro(false);
          setShowPaywall(true);
          try {
            localStorage.removeItem('flowist_stripe_subscribed');
            localStorage.removeItem('flowist_stripe_customer_email');
            localStorage.removeItem('flowist_stripe_plan');
            localStorage.removeItem('flowist_sub_verified_at');
          } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to check Stripe subscription:', err);
      // Network error — don't revoke access for cached subscribers
    } finally {
      setIsWebSubscriptionResolved(true);
    }
  }, [hasVerifiedStripeAccess, isAdminBypass]);

  // Check for Stripe checkout success redirect — verify with server, don't trust URL alone
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_success') === 'true') {
      console.log('Stripe checkout success detected, verifying with server...');
      const plan = params.get('plan');
      const sessionId = params.get('session_id');
      if (plan) {
        (window as any).__stripePlanType = plan;
      }
      setIsWebSubscriptionResolved(false);
      setIsVerifyingCheckout(true);
      setCheckoutVerificationFailed(false);
      // Clean URL immediately
      const url = new URL(window.location.href);
      url.searchParams.delete('stripe_success');
      url.searchParams.delete('plan');
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.pathname);
      
      // Verify subscription with server — retry a few times since webhook may not have fired yet
      const verifyWithRetry = async (retries = 5) => {
        for (let i = 0; i < retries; i++) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = {};
            if (session?.access_token) {
              headers.Authorization = `Bearer ${session.access_token}`;
            }
            if (!session?.access_token && !sessionId) break;
            
            const { data, error } = await supabase.functions.invoke('check-subscription', {
              headers,
              body: sessionId ? { session_id: sessionId } : undefined,
            });
            
            if (error) {
              console.error('Stripe verify attempt', i + 1, 'error:', error);
            }
            
            if (hasVerifiedStripeAccess(data)) {
              console.log('Stripe subscription verified on attempt', i + 1);
              setRcIsPro(true);
              if (data.plan_type) {
                (window as any).__stripePlanType = data.plan_type;
                (window as any).__stripeIsTrialing = data.is_trialing || false;
              }
              if (data.customer_email) {
                try { localStorage.setItem('flowist_stripe_customer_email', data.customer_email); } catch {}
              }
              try { localStorage.setItem('flowist_stripe_subscribed', 'true'); } catch {}
              try { localStorage.setItem('flowist_trial_used', 'true'); } catch {}
              setShowPaywall(false);
              setPaywallFeature(null);
              setIsWebSubscriptionResolved(true);
              setIsVerifyingCheckout(false);
              
              // If no authenticated user, show "secure your subscription" message
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              if (!currentSession?.user) {
                window.dispatchEvent(new CustomEvent('showSecureSubscriptionMessage'));
              }
              return;
            }
          } catch (err) {
            console.error('Stripe verify attempt', i + 1, 'failed:', err);
          }
          // Wait before retrying (2s, 4s, 6s, 8s, 10s)
          if (i < retries - 1) {
            await new Promise(r => setTimeout(r, (i + 1) * 2000));
          }
        }
        console.warn('Stripe subscription not confirmed after retries');
        setIsWebSubscriptionResolved(true);
        setIsVerifyingCheckout(false);
        setCheckoutVerificationFailed(true);
      };
      
      void verifyWithRetry();
    }
  }, [hasVerifiedStripeAccess]);

  // Restore local Stripe subscription on mount — verify with server
  // Don't blindly trust localStorage; always confirm with Stripe API
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    try {
      if (localStorage.getItem('flowist_stripe_subscribed') === 'true') {
        // Don't set rcIsPro here — let checkStripeSubscription verify with server
        // This prevents back-button bypass from Stripe checkout
        console.log('Stripe: Found local subscription flag, will verify with server');
      }
    } catch {}
  }, []);

  // Auto-initialize RevenueCat on mount with Firebase UID for subscription association
  useEffect(() => {
    if (!isInitialized && Capacitor.isNativePlatform()) {
      const initWithFirebaseUser = async () => {
        try {
          const storedUser = await getStoredGoogleUser();
          const appUserID = storedUser?.uid || storedUser?.email || undefined;
          await initialize(appUserID);
        } catch {
          await initialize();
        }
      };
      initWithFirebaseUser();
    } else if (!Capacitor.isNativePlatform()) {
      setIsInitialized(true);
      // Check Stripe subscription on web
      checkStripeSubscription();
    }
  }, [initialize, isInitialized, checkStripeSubscription]);

  // Periodically check Stripe subscription on web (every 60s)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const interval = setInterval(checkStripeSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkStripeSubscription]);

  // Re-check Stripe sub when returning to the tab (after checkout redirect)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkStripeSubscription();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [checkStripeSubscription]);

  // Listen for stripe restore event from paywall
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const handleRestore = () => checkStripeSubscription();
    window.addEventListener('stripeSubscriptionRestored', handleRestore);
    return () => window.removeEventListener('stripeSubscriptionRestored', handleRestore);
  }, [checkStripeSubscription]);

  // Listen for sign-out event — reset all subscription state and show paywall
  // Works for both web (Stripe) and native (RevenueCat/Google Play)
  useEffect(() => {
    const handleSignOut = async () => {
      console.log('SubscriptionContext: User signed out, resetting subscription state');

      // If user was a subscriber (paid or trial), grant 1-day grace period
      const wasPro = rcIsPro || localProAccess || isAdminBypass;
      if (wasPro) {
        console.log('[Grace] User was subscribed — granting 1-day sign-out grace period');
        await setSetting('flowist_signout_grace_ts', Date.now());
        setSignoutGraceActive(true);
      }

      // RevenueCat logout on native (disassociates Google Play subscription from user)
      if (Capacitor.isNativePlatform() && isInitialized) {
        try {
          await Purchases.logOut();
          console.log('RevenueCat: Logged out on sign-out');
        } catch (err) {
          console.error('RevenueCat: Logout on sign-out failed:', err);
        }
      }
      setRcIsPro(false);
      setLocalProAccess(false);
      setIsAdminBypass(false);
      setCustomerInfo(null);
      setIsLocalTrial(false);
      setLocalTrialExpired(false);
      setGraceExpired(false);
      setIsWebSubscriptionResolved(true);
      (window as any).__stripePlanType = undefined;
      (window as any).__stripeIsTrialing = undefined;
      // Clear local trial start so it doesn't grant access after sign-out
      setSetting('flowist_trial_start', 0).catch(() => {});
      setSetting('flowist_admin_bypass', false).catch(() => {});
      try {
        localStorage.removeItem('flowist_stripe_subscribed');
        localStorage.removeItem('flowist_stripe_customer_email');
      } catch {}

      // Only reset onboarding if NO grace period (grace = user stays in app)
      if (!wasPro) {
        setShowPaywall(false);
        setSetting('onboarding_completed', false).catch(() => {});
        window.dispatchEvent(new CustomEvent('flowistOnboardingReset'));
      } else {
        // Grace active — keep the app open, don't show paywall or onboarding
        setShowPaywall(false);
      }
    };
    window.addEventListener('flowistSignedOut', handleSignOut);
    return () => window.removeEventListener('flowistSignedOut', handleSignOut);
  }, [isInitialized, rcIsPro, localProAccess, isAdminBypass]);

  // Re-login to RevenueCat when Google auth state changes (sign in / sign out)
  useEffect(() => {
    const handleAuthChange = async () => {
      if (!Capacitor.isNativePlatform() || !isInitialized) return;
      try {
        const storedUser = await getStoredGoogleUser();
        if (storedUser?.uid) {
          // Log in to RevenueCat with Firebase UID to restore their subscription
          await Purchases.logIn({ appUserID: storedUser.uid });
          const { customerInfo: info } = await Purchases.getCustomerInfo();
          setCustomerInfo(info);
          const hasEntitlement = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
          setRcIsPro(hasEntitlement);
          console.log('RevenueCat: Logged in with Firebase UID, isPro:', hasEntitlement);
          
          // Also check Stripe subscription for this Gmail (cross-platform sync)
          if (!hasEntitlement && storedUser.email) {
            try {
              const { data } = await supabase.functions.invoke('check-subscription', {
                body: { email: storedUser.email.trim().toLowerCase() },
              });
              if (data?.subscribed) {
                setRcIsPro(true);
                if (data.plan_type) {
                  (window as any).__stripePlanType = data.plan_type;
                  (window as any).__stripeIsTrialing = data.is_trialing || false;
                }
                try { localStorage.setItem('flowist_stripe_subscribed', 'true'); } catch {}
                console.log('RevenueCat: No entitlement but found Stripe subscription for', storedUser.email);
              }
            } catch (e) {
              console.warn('Stripe cross-platform check failed:', e);
            }
          }
        }
      } catch (err) {
        console.error('RevenueCat: Error syncing auth state', err);
      }
    };

    window.addEventListener('googleAuthStateChanged', handleAuthChange);
    return () => window.removeEventListener('googleAuthStateChanged', handleAuthChange);
  }, [isInitialized]);

  // Listen for customer info updates
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let isMounted = true;

    const setupListener = async () => {
      try {
        const handle = await Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
          if (isMounted) {
            console.log('RevenueCat: Customer info updated');
            setCustomerInfo(info);
            const hasEntitlement = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
            setRcIsPro(hasEntitlement);
          }
        });
        if (isMounted) setListenerHandle(handle);
      } catch (err) {
        console.error('RevenueCat: Error setting up listener', err);
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      if (listenerHandle) {
        Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: listenerHandle }).catch(console.error);
      }
    };
  }, []);

  // Re-check entitlement when app resumes from background (catches expired trials/subs)
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !isInitialized) return;

    const handleResume = () => {
      console.log('RevenueCat: App resumed, re-checking entitlement');
      checkEntitlement();
    };

    // Capacitor App plugin fires 'resume' but we also listen to visibilitychange for broader coverage
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleResume();
    });

    return () => {
      document.removeEventListener('visibilitychange', handleResume);
    };
  }, [isInitialized, checkEntitlement]);
  // On web: only Stripe-verified subscription or admin bypass grants access (no local trial)
  // On native: RevenueCat + local trial still works
  const isPro = Capacitor.isNativePlatform()
    ? (rcIsPro || localProAccess || signoutGraceActive)
    : (rcIsPro || localProAccess || signoutGraceActive);
  const tier: SubscriptionTier = isPro ? 'premium' : 'free';
  const isLoading = localLoading || rcLoading || (Capacitor.isNativePlatform() && !isInitialized) || (!Capacitor.isNativePlatform() && !isWebSubscriptionResolved);

  // Detect plan type from RevenueCat entitlement or Stripe
  const planType: SubscriptionPlanType = useMemo(() => {
    if (!isPro) return 'none';
    if (localProAccess) return 'monthly';
    // Web Stripe plan type
    const stripePlan = (window as any).__stripePlanType;
    if (!Capacitor.isNativePlatform() && stripePlan) {
      if (stripePlan === 'weekly') return 'weekly';
      if (stripePlan === 'monthly') return 'monthly';
      if (stripePlan === 'yearly') return 'yearly';
    }
    if (!customerInfo) return 'none';
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (!entitlement) return 'none';
    const productId = entitlement.productIdentifier || '';
    if (productId.includes('_yr') || productId.includes('yearly') || productId.includes('annual')) return 'yearly';
    if (productId.includes('weekly') || productId.includes('_wk')) return 'weekly';
    if (productId === PRODUCT_IDS.monthly || productId.includes('month') || productId.includes('mo')) return 'monthly';
    return 'none';
  }, [isPro, customerInfo, localProAccess]);

  const isRecurringSubscriber = planType === 'monthly' || planType === 'weekly' || planType === 'yearly';

  // ==================== Feature Gating ====================

  const canUseFeature = useCallback((feature: PremiumFeature): boolean => {
    if (!isPro) return false;
    if ((RECURRING_ONLY_FEATURES as readonly string[]).includes(feature)) {
      return isRecurringSubscriber;
    }
    return true;
  }, [isPro, isRecurringSubscriber]);

  const requireFeature = useCallback((feature: PremiumFeature): boolean => {
    if ((RECURRING_ONLY_FEATURES as readonly string[]).includes(feature)) {
      if (isRecurringSubscriber) return true;
      setPaywallFeature(feature);
      setShowPaywall(true);
      return false;
    }
    if (isPro) return true;
    setPaywallFeature(feature);
    setShowPaywall(true);
    return false;
  }, [isPro, isRecurringSubscriber]);

  const openPaywall = useCallback((feature?: string) => {
    setPaywallFeature(feature || null);
    setShowPaywall(true);
  }, []);

  const closePaywall = useCallback(() => {
    // Only allow closing paywall if user actually has verified access
    // This prevents bypass via refresh or back-button from Stripe checkout
    if (rcIsPro || localProAccess || isAdminBypass || signoutGraceActive) {
      setShowPaywall(false);
      setPaywallFeature(null);
    }
  }, [rcIsPro, localProAccess, isAdminBypass, signoutGraceActive]);

  const unlockPro = useCallback(async () => {
    await setSetting('flowist_admin_bypass', true);
    setLocalProAccess(true);
    setIsAdminBypass(true);
    setShowPaywall(false);
    setPaywallFeature(null);
  }, []);

  // Check Stripe subscription by email (used from onboarding Google sign-in)
  const checkStripeByEmail = useCallback(async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        body: { email: email.trim().toLowerCase() },
      });
      if (error) {
        console.error('checkStripeByEmail error:', error);
        return false;
      }
      if (data?.subscribed) {
        setRcIsPro(true);
        if (data.plan_type) {
          (window as any).__stripePlanType = data.plan_type;
          (window as any).__stripeIsTrialing = data.is_trialing || false;
        }
        try { localStorage.setItem('flowist_stripe_customer_email', email.trim().toLowerCase()); } catch {}
        try { localStorage.setItem('flowist_stripe_subscribed', 'true'); } catch {}
        setShowPaywall(false);
        setPaywallFeature(null);
        return true;
      }
      setRcIsPro(false);
      setShowPaywall(true);
      return false;
    } catch (err) {
      console.error('checkStripeByEmail failed:', err);
      setRcIsPro(false);
      setShowPaywall(true);
      return false;
    }
  }, []);

  return (
    <UnifiedBillingContext.Provider
      value={{
        // Subscription
        tier,
        planType,
        isPro,
        isRecurringSubscriber,
        isLoading,
        isLocalTrial,
        localTrialExpired,
        graceExpired,
        checkStripeByEmail,
        // Feature gating
        showPaywall,
        isVerifyingCheckout,
        checkoutVerificationFailed,
        paywallFeature,
        openPaywall,
        closePaywall,
        canUseFeature,
        requireFeature,
        unlockPro,
        // RevenueCat
        isInitialized,
        customerInfo,
        offerings,
        error,
        initialize,
        checkEntitlement,
        getOfferings: getOfferingsData,
        purchase,
        purchasePackage,
        restorePurchases,
        presentPaywall: presentPaywallRC,
        presentPaywallIfNeeded,
        presentCustomerCenter,
        logout,
      }}
    >
      {children}
    </UnifiedBillingContext.Provider>
  );
};

// Safe fallback for when context is not yet available (React concurrent error recovery)
const FALLBACK_CONTEXT: UnifiedBillingContextType = {
  tier: 'free',
  planType: 'none',
  isPro: false,
  isRecurringSubscriber: false,
  isLoading: true,
  isLocalTrial: false,
  localTrialExpired: false,
  graceExpired: false,
  checkStripeByEmail: async () => false,
  showPaywall: false,
  isVerifyingCheckout: false,
  checkoutVerificationFailed: false,
  paywallFeature: null,
  openPaywall: () => {},
  closePaywall: () => {},
  canUseFeature: () => false,
  requireFeature: () => false,
  unlockPro: async () => {},
  isInitialized: false,
  customerInfo: null,
  offerings: null,
  error: null,
  initialize: async () => {},
  checkEntitlement: async () => false,
  getOfferings: async () => null,
  purchase: async () => false,
  purchasePackage: async () => false,
  restorePurchases: async () => false,
  presentPaywall: async () => PAYWALL_RESULT.NOT_PRESENTED,
  presentPaywallIfNeeded: async () => PAYWALL_RESULT.NOT_PRESENTED,
  presentCustomerCenter: async () => {},
  logout: async () => {},
};

// Primary hook - unified billing (never throws — returns safe fallback during error recovery)
export const useSubscription = () => {
  const context = useContext(UnifiedBillingContext);
  return context ?? FALLBACK_CONTEXT;
};

// Backward-compatible alias for useRevenueCat consumers
export const useRevenueCat = () => useSubscription();

// Re-export constants
export { ENTITLEMENT_ID, PRODUCT_IDS, REVENUECAT_API_KEY };
