import { motion } from 'framer-motion';
import { ICONS } from '../constants/site.js';

export default function FacilityCard({ facility, index = 0 }) {
  const Icon = ICONS[facility.icon] || ICONS.sparkles;
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.05 }}
      whileHover={{ y: -4 }}
      className="card group h-full overflow-hidden !p-0 transition-shadow hover:shadow-glow"
    >
      {facility.imageUrl && <img src={facility.imageUrl} alt={facility.name} loading="lazy" className="h-36 w-full object-cover" />}
      <div className="p-5">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600 transition group-hover:bg-primary-600 group-hover:text-white dark:bg-primary-900/40">
          <Icon size={22} />
        </span>
        <h3 className="mt-4 text-lg font-semibold">{facility.name}</h3>
        {facility.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{facility.description}</p>}
      </div>
    </motion.article>
  );
}
