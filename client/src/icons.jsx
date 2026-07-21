import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faBriefcaseMedical,
  faChevronDown,
  faClipboard,
  faClock,
  faCommentMedical,
  faDownload,
  faEllipsisVertical,
  faEye,
  faFileMedical,
  faHandHoldingMedical,
  faHouse,
  faMagnifyingGlass,
  faMoon,
  faPen,
  faPlus,
  faReply,
  faRobot,
  faSun,
  faTrash,
  faUserDoctor,
  faUserLarge,
  faUserPlus,
  faUserShield,
  faUsers,
  faVideo,
} from '@fortawesome/free-solid-svg-icons';

const Icon = ({ icon, size = 16, style, ...props }) => (
  <FontAwesomeIcon
    icon={icon}
    style={{ width: size, height: size, ...style }}
    {...props}
  />
);

const makeIcon = (icon) => function MedFlowIcon(props) {
  return <Icon icon={icon} {...props} />;
};

export const HomeIcon = makeIcon(faHouse);
export const ClockIcon = makeIcon(faClock);
export const FileIcon = makeIcon(faFileMedical);
export const BriefcaseIcon = makeIcon(faBriefcaseMedical);
export const ChatIcon = makeIcon(faCommentMedical);
export const ReplyIcon = makeIcon(faReply);
export const BotIcon = makeIcon(faRobot);
export const UsersIcon = makeIcon(faUsers);
export const AdminIcon = makeIcon(faUserShield);
export const AdminPatientsIcon = makeIcon(faClipboard);
export const MoonIcon = makeIcon(faMoon);
export const SunIcon = makeIcon(faSun);
export const PersonIcon = makeIcon(faUserLarge);
export const SearchIcon = makeIcon(faMagnifyingGlass);
export const ChevronDown = makeIcon(faChevronDown);
export const PlusIcon = makeIcon(faPlus);
export const KebabIcon = makeIcon(faEllipsisVertical);
export const EyeIcon = makeIcon(faEye);
export const DownloadIcon = makeIcon(faDownload);
export const EditIcon = makeIcon(faPen);
export const TrashIcon = makeIcon(faTrash);
export const ArrowRight = makeIcon(faArrowRight);
export const VideoIcon = makeIcon(faVideo);
export const BackIcon = makeIcon(faArrowLeft);
export const MedkitIcon = makeIcon(faBriefcaseMedical);
export const HandPlusIcon = makeIcon(faHandHoldingMedical);
export const ChatPlusIcon = makeIcon(faCommentMedical);

// Dashboard statistic icons from the visual specification.
export const MedkitSolid = makeIcon(faBriefcaseMedical);
export const PersonPlusSolid = makeIcon(faUserDoctor);
export const DocPlusSolid = makeIcon(faFileMedical);
export const HandPlusSolid = makeIcon(faHandHoldingMedical);
export const ChatPlusSolid = makeIcon(faCommentMedical);
export const UserPlusSolid = makeIcon(faUserPlus);
