import React, { useState } from 'react';
import { Question } from '../../types';
import { Check, Bookmark, Circle } from 'lucide-react';

interface QuestionNavigationProps {
  questions: Question[];
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
  savedAnswers: Record<
    string,
    { selectedOptionIds: string[]; textResponse: string; isMarkedForReview: boolean }
  >;
}

export const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  questions,
  currentIndex,
  onSelectQuestion,
  savedAnswers,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ANSWERED' | 'UNANSWERED' | 'REVIEW'>('ALL');

  const isAnswered = (qId: string) => {
    const ans = savedAnswers[qId];
    if (!ans) return false;
    return (
      (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
      (ans.textResponse && ans.textResponse.trim().length > 0)
    );
  };

  const isReview = (qId: string) => {
    return Boolean(savedAnswers[qId]?.isMarkedForReview);
  };

  const answeredCount = questions.filter((q) => isAnswered(q.id)).length;
  const reviewCount = questions.filter((q) => isReview(q.id)).length;
  const unansweredCount = questions.length - answeredCount;

  const filteredQuestions = questions
    .map((q, index) => ({ question: q, index }))
    .filter(({ question }) => {
      if (filter === 'ANSWERED') return isAnswered(question.id);
      if (filter === 'UNANSWERED') return !isAnswered(question.id);
      if (filter === 'REVIEW') return isReview(question.id);
      return true;
    });

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h4 className="font-bold text-sm text-navy-900">Question Palette</h4>
        <span className="text-xs font-semibold text-slate-500">
          {answeredCount}/{questions.length} Answered
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl my-3 text-[11px] font-semibold text-slate-600">
        <button
          onClick={() => setFilter('ALL')}
          className={`py-1 rounded-lg transition ${
            filter === 'ALL' ? 'bg-white text-navy-900 shadow-2xs font-bold' : 'hover:text-slate-900'
          }`}
        >
          All ({questions.length})
        </button>
        <button
          onClick={() => setFilter('ANSWERED')}
          className={`py-1 rounded-lg transition ${
            filter === 'ANSWERED' ? 'bg-emerald-500 text-white shadow-2xs font-bold' : 'hover:text-emerald-700'
          }`}
        >
          Done ({answeredCount})
        </button>
        <button
          onClick={() => setFilter('UNANSWERED')}
          className={`py-1 rounded-lg transition ${
            filter === 'UNANSWERED' ? 'bg-white text-navy-900 shadow-2xs font-bold' : 'hover:text-slate-900'
          }`}
        >
          Left ({unansweredCount})
        </button>
        <button
          onClick={() => setFilter('REVIEW')}
          className={`py-1 rounded-lg transition ${
            filter === 'REVIEW' ? 'bg-amber-500 text-white shadow-2xs font-bold' : 'hover:text-amber-700'
          }`}
        >
          Flag ({reviewCount})
        </button>
      </div>

      {/* Grid Palette */}
      <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 overflow-y-auto py-2 flex-1 max-h-72">
        {filteredQuestions.map(({ question, index }) => {
          const answered = isAnswered(question.id);
          const review = isReview(question.id);
          const isCurrent = currentIndex === index;

          let btnColor = 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100';
          if (answered && !review) {
            btnColor = 'bg-emerald-500 text-white border-emerald-600 font-bold';
          } else if (review) {
            btnColor = 'bg-amber-500 text-white border-amber-600 font-bold';
          }

          if (isCurrent) {
            btnColor += ' ring-2 ring-royal-500 ring-offset-2 scale-105';
          }

          return (
            <button
              key={question.id}
              onClick={() => onSelectQuestion(index)}
              className={`h-9 rounded-xl border text-xs font-semibold flex items-center justify-center relative transition duration-150 ${btnColor}`}
            >
              <span>{index + 1}</span>
              {review && (
                <Bookmark className="w-2.5 h-2.5 absolute top-1 right-1 fill-white text-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 rounded-md bg-emerald-500" />
          <span>Answered</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 rounded-md bg-slate-100 border border-slate-300" />
          <span>Unanswered</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 rounded-md bg-amber-500" />
          <span>Marked for review</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 rounded-md border-2 border-royal-500 bg-white" />
          <span>Current question</span>
        </div>
      </div>
    </div>
  );
};
