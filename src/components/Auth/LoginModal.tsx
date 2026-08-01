import { useState } from "react";
import { useApp } from "../../context/AppContext";

export const LoginModal = () => {
    const {
        isLoginOpen,
        setIsLoginOpen,
        login,
    } = useApp();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    if (!isLoginOpen) return null;

    const handleLogin = async () => {
        const success = await login(email, password);

        if (success) {
            setIsLoginOpen(false);
        } else {
            setError("Invalid email or password");
        }
    };

    return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/70 p-3 py-4 sm:p-6 sm:py-6">

        <div className="bg-zinc-900 rounded-xl p-8 w-[420px] space-y-5">

            <h2 className="text-2xl font-bold text-white">
                Log In
            </h2>

            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded bg-zinc-800 text-white outline-none"
            />

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded bg-zinc-800 text-white outline-none"
            />

            {error && (
                <p className="text-red-500 text-sm">
                    {error}
                </p>
            )}

            <button
                onClick={handleLogin}
                className="w-full bg-white text-black rounded-lg py-3 font-bold"
            >
                Log In
            </button>

            <button
                onClick={() => setIsLoginOpen(false)}
                className="w-full text-zinc-400"
            >
                Cancel
            </button>

        </div>

    </div>
);
};