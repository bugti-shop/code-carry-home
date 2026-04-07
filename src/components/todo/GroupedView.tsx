import { TodoItem, Priority, TaskSection } from '@/types/note';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Columns3, Flag, Flame, ChevronRight, ChevronDown, AlertCircle, Sun, Calendar as CalendarIcon2, Clock, CalendarX } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { applyTaskOrder, updateSectionOrder } from '@/utils/taskOrderStorage';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { toast } from 'sonner';
import { useSectionLoadMore } from '@/hooks/useSectionLoadMore';
import { LoadMoreButton } from '@/components/todo/LoadMoreButton';

interface GroupedViewProps {
  groupByOption: string;
  sortedSections: TaskSection[];
  sections: TaskSection[];
  uncompletedItems: TodoItem[];
  completedItems: TodoItem[];
  sectionTaskMap: Map<string, TodoItem[]>;
  priorityTaskMap: Record<string, TodoItem[]>;
  timelineTaskMap: Record<string, TodoItem[]>;
  showCompleted: boolean;
  isCompletedOpen: boolean;
  setIsCompletedOpen: (v: boolean) => void;
  compactMode: boolean;
  collapsedViewSections: Set<string>;
  toggleViewSectionCollapse: (id: string) => void;
  renderTaskItem: (item: TodoItem) => React.ReactNode;
  renderSubtasksInline: (item: TodoItem) => React.ReactNode;
  updateItem: (id: string, updates: Partial<TodoItem>) => void;
  getPriorityColor: (priority: string) => string;
  setOrderVersion: React.Dispatch<React.SetStateAction<number>>;
}

export const GroupedView = ({
  groupByOption,
  sortedSections,
  sections,
  uncompletedItems,
  completedItems,
  sectionTaskMap,
  priorityTaskMap,
  timelineTaskMap,
  showCompleted,
  isCompletedOpen,
  setIsCompletedOpen,
  compactMode,
  collapsedViewSections,
  toggleViewSectionCollapse,
  renderTaskItem,
  renderSubtasksInline,
  updateItem,
  getPriorityColor,
  setOrderVersion,
}: GroupedViewProps) => {
  const { t } = useTranslation();
  const sectionPagination = useSectionLoadMore();

  const groups: { id: string; label: string; color: string; icon: React.ReactNode; tasks: TodoItem[] }[] = [];
  if (groupByOption === 'section') {
    sortedSections.forEach(section => groups.push({ id: section.id, label: section.name, color: section.color, icon: <Columns3 className="h-4 w-4" style={{ color: section.color }} />, tasks: sectionTaskMap.get(section.id) || [] }));
  } else if (groupByOption === 'priority') {
    groups.push(
      { id: 'high', label: t('grouping.highPriority'), color: getPriorityColor('high'), icon: <Flame className="h-4 w-4" style={{ color: getPriorityColor('high') }} />, tasks: priorityTaskMap.high || [] },
      { id: 'medium', label: t('grouping.mediumPriority'), color: getPriorityColor('medium'), icon: <Flag className="h-4 w-4" style={{ color: getPriorityColor('medium') }} />, tasks: priorityTaskMap.medium || [] },
      { id: 'low', label: t('grouping.lowPriority'), color: getPriorityColor('low'), icon: <Flag className="h-4 w-4" style={{ color: getPriorityColor('low') }} />, tasks: priorityTaskMap.low || [] },
      { id: 'none', label: t('grouping.noPriority'), color: getPriorityColor('none'), icon: <Flag className="h-4 w-4" style={{ color: getPriorityColor('none') }} />, tasks: priorityTaskMap.none || [] },
    );
  } else if (groupByOption === 'date') {
    groups.push(
      { id: 'overdue', label: t('grouping.overdue'), color: '#ef4444', icon: <AlertCircle className="h-4 w-4 text-destructive" />, tasks: timelineTaskMap.overdue || [] },
      { id: 'today', label: t('grouping.today'), color: '#3b82f6', icon: <Sun className="h-4 w-4 text-info" />, tasks: timelineTaskMap.today || [] },
      { id: 'tomorrow', label: t('grouping.tomorrow'), color: '#f59e0b', icon: <CalendarIcon2 className="h-4 w-4 text-warning" />, tasks: timelineTaskMap.tomorrow || [] },
      { id: 'this-week', label: t('grouping.thisWeek'), color: '#10b981', icon: <CalendarIcon2 className="h-4 w-4 text-success" />, tasks: timelineTaskMap.thisWeek || [] },
      { id: 'later', label: t('grouping.later'), color: '#8b5cf6', icon: <Clock className="h-4 w-4 text-accent-purple" />, tasks: timelineTaskMap.later || [] },
      { id: 'no-date', label: t('grouping.noDate'), color: '#6b7280', icon: <CalendarX className="h-4 w-4 text-muted-foreground" />, tasks: timelineTaskMap.noDate || [] },
    );
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    const taskId = draggableId;
    const sourceGroup = source.droppableId.replace('grouped-', '');
    const destGroup = destination.droppableId.replace('grouped-', '');
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    if (sourceGroup !== destGroup) {
      if (groupByOption === 'priority') {
        const priorityMap: Record<string, Priority> = { 'high': 'high', 'medium': 'medium', 'low': 'low', 'none': 'none' };
        updateItem(taskId, { priority: priorityMap[destGroup] || 'none' });
        toast.success(t('todayPage.priorityUpdated'));
      } else if (groupByOption === 'section') {
        updateItem(taskId, { sectionId: destGroup });
        toast.success(t('todayPage.sectionMoved'));
      } else if (groupByOption === 'date') {
        const today = new Date();
        let newDate: Date | undefined;
        if (destGroup === 'overdue') newDate = subDays(today, 1);
        else if (destGroup === 'today') newDate = today;
        else if (destGroup === 'tomorrow') { newDate = new Date(); newDate.setDate(newDate.getDate() + 1); }
        else if (destGroup === 'this-week') { newDate = new Date(); newDate.setDate(newDate.getDate() + 3); }
        else if (destGroup === 'later') { newDate = new Date(); newDate.setDate(newDate.getDate() + 14); }
        else if (destGroup === 'no-date') newDate = undefined;
        updateItem(taskId, { dueDate: newDate });
        toast.success(t('todayPage.dateUpdated', 'Date updated'));
      }
      Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    }
    updateSectionOrder(`grouped-${destGroup}`, [taskId]);
    setOrderVersion(v => v + 1);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {groups.map(group => {
          const groupSectionId = `group-${groupByOption}-${group.id}`;
          const isCollapsed = collapsedViewSections.has(groupSectionId);
          const orderedTasks = applyTaskOrder(group.tasks, `grouped-${group.id}`);
          return (
            <div key={group.id} className="bg-muted/30 rounded-xl border border-border/30 overflow-hidden">
              <button onClick={() => toggleViewSectionCollapse(groupSectionId)} className="w-full flex items-center gap-2 px-3 py-3 border-b border-border/30 hover:bg-muted/20 transition-colors" style={{ borderLeft: `4px solid ${group.color}` }}>
                {group.icon}
                <span className="text-sm font-semibold flex-1 text-left">{group.label}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{group.tasks.length}</span>
                {isCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {!isCollapsed && (
                <Droppable droppableId={`grouped-${group.id}`}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className={cn("p-2 space-y-1 min-h-[40px]", compactMode && "p-1 space-y-0", snapshot.isDraggingOver && "bg-primary/5")}>{(() => {
                      const { visible, hasMore, remaining } = sectionPagination.sliceItems(`grouped-${group.id}`, orderedTasks);
                      return orderedTasks.length === 0 ? <div className="py-4 text-center text-sm text-muted-foreground">{t('todayPage.dropTasksHere')}</div> : (<>{visible.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={cn("bg-card rounded-lg border border-border/50", snapshot.isDragging && "shadow-lg ring-2 ring-primary")}>
                              {renderTaskItem(item)}{renderSubtasksInline(item)}
                            </div>
                          )}
                        </Draggable>
                      ))}{hasMore && <LoadMoreButton remaining={remaining} onClick={() => sectionPagination.loadMore(`grouped-${group.id}`)} />}</>);
                    })()}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          );
        })}
        {showCompleted && completedItems.length > 0 && (
          <Collapsible open={isCompletedOpen} onOpenChange={setIsCompletedOpen}>
            <div className="bg-muted/50 rounded-xl p-3 border border-border/30">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between px-2 py-2 hover:bg-muted/60 rounded-lg transition-colors">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('grouping.completed')}</span>
                  <div className="flex items-center gap-2 text-muted-foreground"><span className="text-sm font-medium">{completedItems.length}</span>{isCompletedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className={cn("space-y-2 mt-2", compactMode && "space-y-1 mt-1")}>{completedItems.map(renderTaskItem)}</CollapsibleContent>
            </div>
          </Collapsible>
        )}
      </div>
    </DragDropContext>
  );
};
