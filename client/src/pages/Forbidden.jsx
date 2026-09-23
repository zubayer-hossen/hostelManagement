import StatusPage from './StatusPage.jsx';

export default function Forbidden() {
  return <StatusPage code="403" titleKey="errors.forbiddenTitle" textKey="errors.forbiddenText" />;
}
