import { Sparkles } from 'lucide-react';
import { AI_GLOBAL_STRIP } from '@/features/ai/model/ai-messaging';
import { useAiStatus } from '@/features/ai/model/use-ai-status';

export function AiGlobalStrip() {
  const aiStatus = useAiStatus();

  return (
    <div className="border-primary/20 from-primary/10 via-primary/5 relative shrink-0 overflow-hidden border-b bg-gradient-to-r to-transparent px-3 py-2 lg:px-6">
      <div className="mx-auto flex max-w-7xl items-center gap-2">
        <Sparkles className="text-primary h-4 w-4 shrink-0" aria-hidden />
        <p className="text-foreground min-w-0 text-xs font-semibold leading-snug sm:text-sm">
          {AI_GLOBAL_STRIP}
          {aiStatus.data?.enabled ? (
            <span className="text-primary ml-1 hidden sm:inline">— AI активен на сервере</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
