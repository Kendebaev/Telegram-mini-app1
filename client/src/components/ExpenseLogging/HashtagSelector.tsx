import React from 'react';
import { Tag } from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useTranslation } from '../../stores/settingsStore';
import { useTelegram } from '../../context/TelegramContext';
import { Chip } from '../ui/Chip';

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
  const { t } = useTranslation();
  const { haptic } = useTelegram();

  const toggleTag = (tag: string) => {
    haptic.impact('light');
    const clean = tag.replace(/^#/, '').toLowerCase();
    onChangeTags(tags.includes(clean) ? tags.filter((x) => x !== clean) : [...tags, clean]);
  };

  return (
    <div className="space-y-2.5">
      <input
        type="text"
        value={note}
        onChange={(e) => onChangeNote(e.target.value)}
        placeholder={t('note_or_hashtag')}
        className="w-full rounded-2xl border border-line bg-panel-inset px-3.5 py-2.5 text-[13px] text-ink placeholder:text-faint focus:border-accent/40 focus:outline-none"
      />

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag size={12} className="text-accent" />
          {tags.map((tag) => (
            <Chip key={tag} size="sm" active accent="var(--accent)" onClick={() => toggleTag(tag)}>
              #{tag} ×
            </Chip>
          ))}
        </div>
      )}

      {hashtagSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-faint">
            {t('suggested')}
          </span>
          {hashtagSuggestions.slice(0, 8).map((tag) => (
            <Chip
              key={tag}
              size="sm"
              active={tags.includes(tag)}
              accent="var(--accent)"
              onClick={() => toggleTag(tag)}
            >
              #{tag}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
};
