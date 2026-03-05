import { useNavigate } from 'react-router-dom';
import { Play, Disc } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import themeSong from '../assets/Song/theme.mp3';

export default function Home() {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [introPhase, setIntroPhase] = useState<'black' | 'quote' | 'logo' | 'tagline' | 'fadeout' | 'done'>('black');
    const audioRef = useRef(new Audio(themeSong));

    useEffect(() => {
        // Set volume lower for subtle effect
        audioRef.current.volume = 0.5;

        let t1: ReturnType<typeof setTimeout>;
        let t2: ReturnType<typeof setTimeout>;
        let t3: ReturnType<typeof setTimeout>;
        let t4: ReturnType<typeof setTimeout>;
        let t5: ReturnType<typeof setTimeout>;

        const hasPlayedIntro = sessionStorage.getItem('homeIntroPlayed');

        if (hasPlayedIntro) {
            setIntroPhase('done');
            setIsVisible(true);
        } else {
            // Intro Sequence
            t1 = setTimeout(() => setIntroPhase('quote'), 400);
            t2 = setTimeout(() => setIntroPhase('logo'), 3000);
            t3 = setTimeout(() => setIntroPhase('tagline'), 4000);
            t4 = setTimeout(() => setIntroPhase('fadeout'), 5500);
            t5 = setTimeout(() => {
                setIntroPhase('done');
                setIsVisible(true);
                sessionStorage.setItem('homeIntroPlayed', 'true');
            }, 6200);
        }

        // Restore saved playback time
        const savedTime = sessionStorage.getItem('homeVinylTime');
        if (savedTime) {
            audioRef.current.currentTime = parseFloat(savedTime);
        }

        return () => {
            if (!hasPlayedIntro) {
                clearTimeout(t1);
                clearTimeout(t2);
                clearTimeout(t3);
                clearTimeout(t4);
                clearTimeout(t5);
            }
            // Save time and cleanup
            sessionStorage.setItem('homeVinylTime', audioRef.current.currentTime.toString());
            audioRef.current.pause();
        };
    }, []);

    const handleMouseEnter = () => {
        setIsPlaying(true);
        audioRef.current.play().catch(error => {
            console.error("Audio playback failed:", error);
        });
    };

    const handleMouseLeave = () => {
        setIsPlaying(false);
        audioRef.current.pause();
        // Save current time instead of resetting
        sessionStorage.setItem('homeVinylTime', audioRef.current.currentTime.toString());
    };

    return (
        <div className="min-h-screen bg-white text-black font-sans overflow-x-hidden selection:bg-black selection:text-white">
            {/* Intro Splash Screen Overlay */}
            {introPhase !== 'done' && (
                <div
                    className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] transition-opacity duration-700
                        ${introPhase === 'fadeout' ? 'opacity-0' : 'opacity-100'}
                    `}
                >
                    {/* The Quote */}
                    <p
                        className={`absolute italic text-lg text-gray-300 transition-all duration-1000 tracking-wider max-w-lg text-center
                            ${introPhase === 'quote' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                            ${(introPhase === 'logo' || introPhase === 'tagline' || introPhase === 'fadeout') ? 'hidden' : ''}
                        `}
                    >
                        "The rhythm of the track... the pulse of the heart."
                    </p>

                    {/* The Logo */}
                    <div
                        className={`absolute w-32 h-32 md:w-40 md:h-40 rounded-full bg-white shadow-[0_0_80px_20px_rgba(255,255,255,0.2)] flex items-center justify-center transition-transform duration-700
                            ${(introPhase === 'logo' || introPhase === 'tagline' || introPhase === 'fadeout') ? 'scale-100 animate-pulse' : 'scale-0'}
                            ${(introPhase === 'black' || introPhase === 'quote') ? 'pointer-events-none' : ''}
                        `}
                    >
                        <span className="text-black text-2xl md:text-3xl font-black tracking-[0.3em]">KITA</span>
                    </div>

                    <p
                        className={`absolute mt-48 italic text-[10px] md:text-sm text-gray-400 transition-opacity duration-700 uppercase tracking-[0.5em] md:tracking-[0.8em]
                            ${introPhase === 'tagline' || introPhase === 'fadeout' ? 'opacity-100' : 'opacity-0'}
                        `}
                    >
                        System Initialization
                    </p>
                </div>
            )}

            {/* Background Texture */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none invert mix-blend-difference"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}>
            </div>

            {/* Hoyoverse Minimalist Decorative Elements */}
            <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-gray-200 rounded-full blur-[100px] opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-black rounded-full blur-[150px] opacity-10 translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
            <div className="fixed -left-20 top-1/4 w-[120vw] h-40 bg-black opacity-[0.02] -rotate-12 pointer-events-none transform origin-center"></div>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center px-4 sm:px-6 lg:px-20 pt-24 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full max-w-7xl mx-auto items-center">

                    {/* Left: Text Content */}
                    <div className={`space-y-6 md:space-y-8 z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                        <div className="inline-flex items-center gap-3 px-4 sm:px-6 py-2 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <span className="w-2 h-2 bg-black animate-pulse"></span>
                            <span className="text-black text-[10px] sm:text-xs font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase">KITA PROJECT // OVERRIDE</span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl md:text-[7rem] font-black leading-[0.9] tracking-tighter uppercase">
                            RHYTHM <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-400">
                                OF SPEED
                            </span>
                        </h1>

                        <p className="text-base sm:text-xl text-gray-600 max-w-lg leading-relaxed border-l-4 border-black pl-6 font-medium">
                            Experience music with the intensity of a race. <br />
                            Curated playlists inspired by legends.
                        </p>

                        <div className="flex flex-wrap gap-4 sm:gap-6 pt-2">
                            <button
                                onClick={() => navigate('/music')}
                                className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-black text-white font-black rounded-none shadow-[6px_6px_0px_0px_rgba(156,163,175,1)] hover:shadow-[2px_2px_0px_0px_rgba(156,163,175,1)] hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-4 uppercase tracking-widest border border-black text-sm sm:text-base"
                            >
                                <Play className="w-5 h-5 fill-current border border-white rounded-full p-1" />
                                <span>Start Protocol</span>
                            </button>

                            <button
                                onClick={() => navigate('/music')}
                                className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-black font-black border-2 border-black hover:bg-gray-100 transition-colors flex items-center gap-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] uppercase tracking-widest text-sm sm:text-base"
                            >
                                <Disc className="w-5 h-5" />
                                <span>Browse Archive</span>
                            </button>
                        </div>
                    </div>

                    {/* Right: Spinning Vinyl */}
                    <div className={`relative flex justify-center items-center transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                        {/* Glow effect behind */}
                        <div className="absolute w-[80%] h-[80%] bg-black/5 rounded-full blur-[40px] animate-pulse"></div>

                        {/* The Vinyl Record */}
                        <div
                            className="relative w-[220px] h-[220px] sm:w-[320px] sm:h-[320px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] rounded-full cursor-pointer group shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)]"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            style={{
                                animation: `spin 8s linear infinite`,
                                animationPlayState: isPlaying ? 'running' : 'paused',
                                boxShadow: '0 0 0 10px #f5f5f5, 0 0 0 25px #fff, 0 20px 50px -10px rgba(0,0,0,0.3)'
                            }}
                        >
                            {/* Vinyl Texture */}
                            <div className="absolute inset-0 rounded-full bg-[#111] overflow-hidden border-[6px] border-white shadow-[0_0_0_2px_rgba(0,0,0,1)]">
                                <div className="absolute inset-0 opacity-30"
                                    style={{
                                        backgroundImage: 'repeating-radial-gradient(#222 0, #000 2px, #000 3px)'
                                    }}></div>

                                {/* Light reflection on vinyl */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-full pointer-events-none mix-blend-overlay"></div>
                            </div>

                            {/* Center Label (Album Art) */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-white rounded-full border-4 border-[#111] overflow-hidden flex items-center justify-center">
                                {/* <img
                                    src="src/assets/3ba24ff35f84be33f4458bb4599935b6.jpg"
                                    alt="Album Art"
                                    className="w-full h-full object-cover opacity-60 grayscale"
                                /> */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="font-black text-black text-2xl tracking-[0.2em] mix-blend-difference bg-white/50 px-3 py-1 -mt-1 backdrop-blur-sm">キタ</span>
                                </div>
                            </div>
                        </div>

                        {/* Tone Arm (Stylized representation) */}
                        <div className={`absolute top-0 right-10 w-4 h-48 sm:h-64 bg-gray-200 origin-top transition-transform duration-700 rounded-full shadow-xl border-2 border-black ${isPlaying ? 'rotate-12' : '-rotate-12'}`}>
                            <div className="absolute -bottom-3 -left-3 w-10 h-16 bg-black rounded-sm border-2 border-gray-300"></div>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-60 animate-bounce">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Scroll</span>
                    <div className="w-px h-16 bg-gradient-to-b from-black to-transparent"></div>
                </div>
            </section>

            {/* Content Sections Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-20 sm:space-y-32">

                {/* System Features - Abstract Layout */}
                <section className="border-4 border-black bg-white p-8 sm:p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative">
                    <div className="absolute top-0 right-0 bg-black text-white px-4 py-2 font-black uppercase text-xs tracking-widest">
                        SYS.MODULES_v2.0
                    </div>

                    <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter mb-12 text-black">
                        Core Architecture
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Module 1 */}
                        <div className="border-2 border-black p-6 group hover:bg-black hover:text-white transition-colors cursor-pointer">
                            <div className="w-12 h-12 border-2 border-black group-hover:border-white mb-6 flex items-center justify-center font-black text-xl">
                                01
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Sonic Integrity</h3>
                            <p className="text-sm font-bold uppercase tracking-widest leading-relaxed opacity-60">
                                High-fidelity audio processing pipeline. Uncompromised acoustic delivery.
                            </p>
                        </div>

                        {/* Module 2 */}
                        <div className="border-2 border-black p-6 group hover:bg-black hover:text-white transition-colors cursor-pointer bg-gray-50 hover:bg-black">
                            <div className="w-12 h-12 bg-black text-white group-hover:bg-white group-hover:text-black mb-6 flex items-center justify-center font-black text-xl">
                                02
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Neural Library</h3>
                            <p className="text-sm font-bold uppercase tracking-widest leading-relaxed opacity-60">
                                Infinite archive expansion. Automated cataloguing and retrieval protocols.
                            </p>
                        </div>

                        {/* Module 3 */}
                        <div className="border-2 border-black p-6 group hover:bg-black hover:text-white transition-colors cursor-pointer">
                            <div className="w-12 h-12 border-2 border-black group-hover:border-white rounded-full mb-6 flex items-center justify-center font-black text-xl">
                                03
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Sync Network</h3>
                            <p className="text-sm font-bold uppercase tracking-widest leading-relaxed opacity-60">
                                Real-time frequency synchronization across global terminal nodes.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Aesthetic Banner */}
                <section className="relative h-64 sm:h-80 overflow-hidden bg-black flex items-center justify-center border-y-8 border-gray-100 mix-blend-multiply flex-col">
                    <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,#fff_20px,#fff_40px)]"></div>
                    <div className="flex whitespace-nowrap overflow-hidden w-full relative z-10">
                        <div className="animate-marquee flex-shrink-0 font-black text-6xl sm:text-8xl lg:text-[10rem] text-transparent uppercase tracking-tighter" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.8)' }}>
                            NO SIGNAL LOSS • NO COMPROMISE • BEYOND FREQUENCY •&nbsp;
                        </div>
                        <div className="animate-marquee flex-shrink-0 font-black text-6xl sm:text-8xl lg:text-[10rem] text-transparent uppercase tracking-tighter" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.8)' }}>
                            NO SIGNAL LOSS • NO COMPROMISE • BEYOND FREQUENCY •&nbsp;
                        </div>
                    </div>
                </section>

                {/* Data-Free Informational Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-0 border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,0.1)]">
                    <div className="p-12 sm:p-16 flex flex-col justify-center bg-white border-b-4 md:border-b-0 md:border-r-4 border-black relative overflow-hidden group">
                        <div className="absolute -right-20 -bottom-20 w-64 h-64 border-[16px] border-gray-100 rounded-full group-hover:scale-110 transition-transform duration-700"></div>
                        <h2 className="text-4xl sm:text-6xl font-black uppercase text-black mb-6 relative z-10 tracking-tighter">
                            Analog<br />Meets<br />Digital
                        </h2>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest relative z-10 max-w-sm leading-relaxed">
                            Bridging the gap between raw organic soundscapes and precise digital algorithms.
                        </p>
                        <button onClick={() => navigate('/music')} className="mt-8 self-start px-8 py-4 bg-black text-white font-black uppercase tracking-widest hover:bg-gray-800 transition-colors relative z-10 shadow-[4px_4px_0px_0px_rgba(200,200,200,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(200,200,200,1)]">
                            Read Manual
                        </button>
                    </div>

                    <div className="p-12 sm:p-16 flex flex-col justify-center bg-gray-50 relative overflow-hidden group">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,black_1px,transparent_1px)] bg-[length:20px_20px] group-hover:scale-105 transition-transform duration-1000"></div>
                        <div className="relative z-10">
                            <h2 className="text-4xl sm:text-6xl font-black uppercase text-black mb-6 tracking-tighter">
                                Infinite<br />Playback<br />Loop
                            </h2>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest max-w-sm leading-relaxed">
                                The archive never sleeps. Continuous streaming protocols ensure 100% uptime.
                            </p>
                            <button onClick={() => navigate('/music')} className="mt-8 self-start px-8 py-4 bg-transparent text-black border-4 border-black font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors relative z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                                View Status
                            </button>
                        </div>
                    </div>
                </section>

                {/* Footer CTA */}
                <section className="relative overflow-hidden bg-black border-[8px] border-double border-gray-800 p-8 sm:p-16 lg:p-24 text-center group">
                    {/* Background noise texture inverse */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                        }}>
                    </div>

                    {/* Diagonal stripes overlay */}
                    <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#333_10px,#333_20px)]"></div>

                    <div className="relative z-10 bg-white p-12 lg:p-16 border-4 border-black shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)] md:mx-12 lg:mx-24 transform group-hover:-translate-y-2 transition-transform">
                        <div className="absolute -top-4 -left-4 w-8 h-8 bg-black"></div>
                        <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-black"></div>
                        <h2 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter uppercase text-black">
                            INITIALIZE <br /> <span className="text-gray-400">YOUR FILE</span>
                        </h2>
                        <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto font-medium">
                            Create your sys.profile, build your archive, and share your frequency map.
                        </p>

                        <button
                            onClick={() => navigate('/music')}
                            className="px-12 md:px-16 py-5 md:py-6 bg-black text-white font-black text-lg md:text-xl hover:bg-white hover:text-black hover:border-black border-4 border-transparent transition-all uppercase tracking-[0.2em] shadow-[8px_8px_0px_0px_rgba(200,200,200,1)] hover:shadow-none translate-x-[-4px] translate-y-[-4px] hover:translate-x-0 hover:translate-y-0"
                        >
                            CONNECT NOW
                        </button>
                    </div>
                </section>

            </div>

            {/* Inline Styles for Keyframe Animations */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes marquee {
                    from { transform: translateX(0); }
                    to { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 15s linear infinite;
                }
            `}</style>
        </div>
    );
}
