import React from 'react';
import { Tag } from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useTelegram } from '../../context/TelegramContext';
import { GlassBadge } from '../glass/GlassBadge';

interface HashtagSelectorProps {
  note: string;
  onChangeNote: (note: string) => void;
  tags: string[];
  onChangeTags: (tags: string[]) => void;
}

export const HashtagSelector: React.FC<HashtagSelectorProps> = ({
  note,
  onChangeNote,
  tags,
  onChangeTags,
}) => {
  const { hashtagSuggestions } = useTransactionStore();
  const { haptic } = useTelegram();

  const handleToggleTag = (tag: string) => {
    haptic.impact('light');
    const clean = tag.replace(/^#/, '').toLowerCase();
    let nextTags: string[];

    if (tags.includes(clean)) {
      nextTags = tags.filter((t) => t !== clean);
    } else {
      nextTags = [...tags, clean];
    }
    onChangeTags(nextTags);
  };

  return (
    <div className="w-full space-y-2.5">
      {/* Note input field */}
      <div className="relative">
        <input
          type="text"
          value={note}
          onChange={(e) => onChangeNote(e.target.value)}
          placeholder="Note or #hashtag (e.g. Lunch with team #work)"
          className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-sm placeholder:text-slate-500"
        />
      </div>

      {/* Selected tags chip bar */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center px-1">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Tag size={12} className="text-indigo-400" />
            Tags:
          </span>
          {tags.map((t) => (
            <GlassBadge
              key={t}
              variant="brand"
              size="xs"
              clickable
              onClick={() => handleToggleTag(t)}
            >
              #{t} ×
            </GlassBadge>
          ))}
        </div>
      )}

      {/* Suggested hashtags pills */}
      {hashtagSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center px-1 pt-0.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            Suggested:
          </span>
          {hashtagSuggestions.slice(0, 8).map((suggested) => {
            const isSelected = tags.includes(suggested);
            return (
              <button
                key={suggested}
                type="button"
                onClick={() => handleToggleTag(suggested)}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-indigo-500/25 border-indigo-500/50 text-indigo-300 font-semibold'
                    : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-slate-200'
                }`}
              >
                #{suggested}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
