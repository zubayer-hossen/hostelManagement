import { Link } from 'react-router-dom';
import { isExternal } from '../utils/links.js';

/** Internal paths use the router; absolute URLs open in a new tab safely. */
export default function SmartLink({ to, children, ...rest }) {
  if (!to) return <span {...rest}>{children}</span>;
  if (isExternal(to)) return <a href={to} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>;
  return <Link to={to} {...rest}>{children}</Link>;
}
