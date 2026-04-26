import { FaRegUser } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";
import { FcGoogle } from "react-icons/fc";
import { GoTrash } from "react-icons/go";
import { LiaUserEditSolid } from "react-icons/lia";
import { CiEdit } from "react-icons/ci";
import { LuSearch } from "react-icons/lu";
import { RxDashboard } from "react-icons/rx";
import { MdPostAdd } from "react-icons/md";
import { PiChalkboardTeacher } from "react-icons/pi";
import { GoCreditCard } from "react-icons/go";
import { LiaToolsSolid } from "react-icons/lia";
import { PiChatCircleTextLight } from "react-icons/pi";
import { FiShoppingCart } from "react-icons/fi";
import { HiOutlineNewspaper } from "react-icons/hi2";
import { IoHelpCircleOutline } from "react-icons/io5";
import { HiEye, HiEyeOff } from "react-icons/hi";

export const icons = {
    dashboard: <RxDashboard/>,
    blog: <MdPostAdd/>,
    mentorship: <PiChalkboardTeacher/>,
    tool: <LiaToolsSolid/>,
    consultant: <PiChatCircleTextLight/>,
    email: <MdEmail className="inputIcon"/>,
    user: <FaRegUser className="inputIcon"/>,
    password: <RiLockPasswordLine className="inputIcon"/>,
    google: <FcGoogle className="googleIcon"/>,
    trash: <GoTrash/>,
    edituser: <LiaUserEditSolid/>,
    editpassword: <CiEdit/>,
    subsrciption: <GoCreditCard/>,
    search: <LuSearch/>,
    shop: <FiShoppingCart/>,
    newspaper: <HiOutlineNewspaper/>,
    help: <IoHelpCircleOutline/>,
    eye: <HiEye className="inputIcon"/>,
    eyeOff: <HiEyeOff className="inputIcon"/>
}
