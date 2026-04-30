import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthButtons from '../components/AuthButtons';
import MessageDisplay from '../components/MessageDisplay';

export default function Signin() {
    const [message, setMessage] = useState({success: '', err: ''});
    const { user } = useAuth();
    const navigate  = useNavigate();
    const [searchParams] = useSearchParams();
    const initialMode = searchParams.get('mode') === 'register';

    useEffect(() => {
        if (!user) return;
        const hasDraft = localStorage.getItem('scanframe_qr_pending');
        navigate(hasDraft ? '/#newframes' : '/dashboard', { replace: true });
    }, [user]);

    return (
        <main className={`min-h-screen flex flex-col justify-between bg-[#000000] transition-colors duration-200`}>
            <section className="h-fit bg-[#000000] bg-[url('./assets/images/Background.png')] bg-contain bg-no-repeat bg-center flex items-center justify-end pt-[50px] sm:pr-[8%] lg:pr-[12%] xl:pr-[15%]">
                <div className='relative mx-auto sm:m-0 max-w-[425px]'>
                    <MessageDisplay message={message} setMessage={setMessage}/>
                    <AuthButtons setMessage={setMessage} initialMode={initialMode} />
                </div>
            </section>
        </main>
    );
}