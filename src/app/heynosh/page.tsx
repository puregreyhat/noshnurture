'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function HeyNoshWebSimulator() {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Play TTS using Web Speech API
    const playAudio = (text: string) => {
        if (!('speechSynthesis' in window)) {
            alert('Sorry, your browser does not support text-to-speech!');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Find a natural-sounding English voice if possible
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || v.lang === 'en-US');
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setLoading(true);
        setAiResponse('');
        window.speechSynthesis.cancel();
        setIsSpeaking(false);

        try {
            const res = await fetch('/api/heynosh', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer test_token_simulation`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: input })
            });

            if (!res.ok) {
                setAiResponse("Oops! I hit a snag while trying to fetch that info.");
                setLoading(false);
                return;
            }

            const data = await res.json();
            setAiResponse(data.text);
            playAudio(data.text);
            setInput(''); // Clear input

            // Link the simulator payload specifically to the ESP32 UUID so it finds it!
            fetch('/api/esp32/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: data.text, 
                    targetDeviceId: '809a0ac6-c099-4761-a0f2-f7094c3d9075' 
                })
            }).catch(e => console.error("Failed to push to esp32:", e));

        } catch (err) {
            setAiResponse("Something went wrong! Check your network connection.");
        } finally {
            setLoading(false);
        }
    };

    // Ensure speech voices are loaded
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
        }

        // Cleanup speech on unmount
        return () => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        }
    }, []);

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 pt-20 relative overflow-hidden">
            {/* Background glowing orbs */}
            <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] transition-all duration-1000 ${isSpeaking ? 'scale-150 opacity-50' : 'scale-100 opacity-20'}`}></div>
            <div className={`absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/20 rounded-full blur-[120px] transition-all duration-1000 ${loading ? 'scale-125 opacity-60' : 'scale-100 opacity-20'}`}></div>

            <main className="z-10 w-full max-w-2xl flex flex-col items-center">

                {/* Visualizer / Avatar */}
                <div className="mb-12 relative flex items-center justify-center">
                    <div className={`absolute inset-0 rounded-full bg-emerald-400 blur-xl transition-all duration-300 ${isSpeaking ? 'opacity-60 scale-125 animate-pulse' : 'opacity-0 scale-75'}`}></div>
                    <div className={`w-36 h-36 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden z-10 transition-transform ${isSpeaking ? 'scale-105' : 'scale-100'}`}>
                        {loading ? (
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        ) : isSpeaking ? (
                            <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                        ) : (
                            <svg className="w-12 h-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        )}
                    </div>
                </div>

                {/* AI Response Text */}
                <div className="min-h-[120px] w-full mb-12 flex flex-col items-center justify-center text-center px-4">
                    {aiResponse ? (
                        <h2 className="text-2xl md:text-3xl font-medium text-white/90 leading-relaxed tracking-wide">
                            "{aiResponse}"
                        </h2>
                    ) : (
                        <h2 className="text-xl text-neutral-500 font-light">
                            {loading ? "Thinking..." : "Type your command to talk to HeyNosh"}
                        </h2>
                    )}
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="w-full relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                    <div className="relative flex items-center bg-neutral-900 rounded-2xl p-2 border border-white/10 shadow-xl">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading || isSpeaking}
                            placeholder="Ask HeyNosh about your inventory or recipes..."
                            className="w-full bg-transparent text-white px-4 py-3 outline-none placeholder:text-neutral-500 disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="bg-white text-black p-3 rounded-xl ml-2 font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                "Send"
                            )}
                        </button>
                    </div>
                </form>

                <p className="mt-8 text-xs text-neutral-600">
                    Response is read out loud via your browser's native Text-to-Speech API.
                </p>
            </main>
        </div>
    );
}
