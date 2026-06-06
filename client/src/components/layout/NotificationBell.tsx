import { useEffect, useState } from 'react';
import { IconBell } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../stores/notificationStore';
import { api } from '../../lib/api';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const items = useNotificationStore((s) => s.items);
  const fetch = useNotificationStore((s) => s.fetch);
  const markRead = useNotificationStore((s) => s.markRead);
  const unread = items.filter((i) => !i.read).length;
  const navigate = useNavigate();

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-full p-1.5 text-brand-muted hover:bg-brand-bg"
      >
        <IconBell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-alert-red text-[9px] text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-1 w-72 rounded-[12px] border border-brand-brown/10 bg-brand-card p-2 shadow-card">
            {items.length === 0 ? (
              <p className="p-3 text-[11px] text-brand-muted">No notifications</p>
            ) : (
              items.slice(0, 8).map((n) => (
                <div
                  key={n.id}
                  className={`mb-1 rounded-lg p-2 text-[10px] ${n.read ? 'opacity-60' : 'bg-brand-bg'}`}
                >
                  <div className="font-medium">{n.title}</div>
                  <div className="text-brand-muted line-clamp-2">{n.body}</div>
                  <div className="mt-1 flex gap-1">
                    {n.orderId && (
                      <button
                        type="button"
                        className="rounded bg-badge-blue-bg px-2 py-0.5 text-badge-blue-text"
                        onClick={() => {
                          markRead(n.id);
                          navigate(`/orders?select=${n.orderId}`);
                          setOpen(false);
                        }}
                      >
                        View
                      </button>
                    )}
                    {!n.read && (
                      <button
                        type="button"
                        className="text-brand-muted"
                        onClick={() => markRead(n.id)}
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            <button
              type="button"
              className="w-full py-1 text-[10px] text-brand-muted"
              onClick={() => api.post('/notifications/read-all').then(fetch)}
            >
              Mark all read
            </button>
          </div>
        </>
      )}
    </div>
  );
}
