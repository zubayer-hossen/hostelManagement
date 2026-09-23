import { useState } from 'react';
import { Flag, Reply, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { blogApi } from '../api/blog.js';
import { formatDateTime } from '../utils/format.js';
import { getErrorMessage } from '../utils/errors.js';

function Comment({ c, onReply, onChanged, depth = 0 }) {
  const { t, i18n } = useTranslation();
  const { user, hasPermission } = useAuth();
  const mine = user && (c.user === user.id || c.user?.id === user.id);
  const canModerate = hasPermission('manageBlogs');

  const report = async () => { try { await blogApi.reportComment(c.id, ''); toast.success(t('blog.reportSent')); } catch (err) { toast.error(getErrorMessage(err)); } };
  const remove = async () => {
    if (!window.confirm(t('cms.deleteConfirm'))) return;
    try { await blogApi.deleteComment(c.id); toast.success(t('cms.deleted')); onChanged(); } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <li className={depth ? 'ml-8 border-l border-slate-200 pl-4 dark:border-slate-800' : ''}>
      <div className="py-3">
        <p className="text-sm font-semibold">{c.userName} <span className="ml-1 font-normal text-xs text-slate-500">{formatDateTime(c.createdAt, i18n.language)}</span></p>
        <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{c.text}</p>
        <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
          {depth === 0 && user && <button onClick={() => onReply(c)} className="flex items-center gap-1 hover:text-primary-600"><Reply size={13} />{t('blog.reply')}</button>}
          {user && !mine && <button onClick={report} className="flex items-center gap-1 hover:text-amber-600"><Flag size={13} />{t('blog.report')}</button>}
          {(mine || canModerate) && <button onClick={remove} className="flex items-center gap-1 hover:text-red-600"><Trash2 size={13} />{t('cms.delete')}</button>}
        </div>
      </div>
      {c.replies?.length > 0 && <ul>{c.replies.map((r) => <Comment key={r.id} c={r} onReply={onReply} onChanged={onChanged} depth={depth + 1} />)}</ul>}
    </li>
  );
}

export default function CommentThread({ comments, onReply, onChanged }) {
  const { t } = useTranslation();
  if (!comments.length) return <p className="py-4 text-sm text-slate-500">{t('blog.noComments')}</p>;
  return <ul className="divide-y divide-slate-100 dark:divide-slate-800">{comments.map((c) => <Comment key={c.id} c={c} onReply={onReply} onChanged={onChanged} />)}</ul>;
}
