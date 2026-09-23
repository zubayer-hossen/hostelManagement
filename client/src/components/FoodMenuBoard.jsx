import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Cookie, Moon, Soup, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DAYS, MEALS } from '../constants/site.js';
import Badge from './ui/Badge.jsx';

const MEAL_ICONS = { breakfast: Coffee, lunch: Soup, snack: Cookie, dinner: Moon };
const JS_DAY_TO_KEY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Weekly menu with day tabs. For a boys/girls view, a hostel-specific entry wins over the shared ("all") one.
 */
export default function FoodMenuBoard({ menu, hostelType = 'all' }) {
  const { t } = useTranslation();
  const [day, setDay] = useState(JS_DAY_TO_KEY[new Date().getDay()]);

  const byMeal = useMemo(() => {
    const map = {};
    for (const item of menu) {
      if (item.day !== day) continue;
      if (hostelType !== 'all' && item.hostelType !== 'all' && item.hostelType !== hostelType) continue;
      const current = map[item.meal];
      // prefer the specific entry over the shared one
      if (!current || (current.hostelType === 'all' && item.hostelType !== 'all')) map[item.meal] = item;
    }
    return map;
  }, [menu, day, hostelType]);

  return (
    <div>
      <div role="tablist" aria-label={t('public.food.days')} className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-2">
        {DAYS.map((d) => (
          <button
            key={d}
            role="tab"
            aria-selected={day === d}
            onClick={() => setDay(d)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              day === d ? 'bg-primary-600 text-white shadow-glow' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {t(`public.food.dayNames.${d}`)}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MEALS.map((meal, i) => {
          const entry = byMeal[meal];
          const Icon = MEAL_ICONS[meal];
          return (
            <motion.div key={`${day}-${meal}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card h-full">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/40"><Icon size={20} /></span>
                {entry?.isSpecial && <Badge tone="amber"><Star size={12} className="mr-1" />{t('public.food.special')}</Badge>}
              </div>
              <h3 className="mt-3 text-lg font-semibold">{t(`public.food.meals.${meal}`)}</h3>
              {entry ? (
                <>
                  {entry.imageUrl && <img src={entry.imageUrl} alt="" loading="lazy" className="mt-3 h-28 w-full rounded-lg object-cover" />}
                  <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    {entry.items.map((it, k) => <li key={k}>• {it}</li>)}
                  </ul>
                  {entry.description && <p className="mt-2 text-xs text-slate-500">{entry.description}</p>}
                  {typeof entry.price === 'number' && <p className="mt-3 text-sm font-semibold">৳ {entry.price}</p>}
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-400">{t('public.food.notSet')}</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
