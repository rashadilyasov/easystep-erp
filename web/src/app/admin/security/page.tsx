"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function AdminSecurity() {
  const [setup, setSetup] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null);

  const load2FAStatus = async () => {
    try {
      const me = await api.me();
      setTwoFactorEnabled(me.role === "SuperAdmin" ? null : false);
    } catch {
      setTwoFactorEnabled(false);
    }
  };

  const handleSetup = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.auth.twoFactorSetup();
      setSetup({ secret: res.secret, qrCodeUrl: res.qrCodeUrl });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Xəta" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode || verifyCode.length !== 6) return;
    setLoading(true);
    setMessage(null);
    try {
      await api.auth.twoFactorVerify(verifyCode);
      setMessage({ type: "success", text: "2FA aktivləşdirildi" });
      setSetup(null);
      setVerifyCode("");
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Kod səhvdir" });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword || !disableCode) return;
    setLoading(true);
    setMessage(null);
    try {
      await api.auth.twoFactorDisable(disablePassword, disableCode);
      setMessage({ type: "success", text: "2FA deaktivləşdirildi" });
      setDisablePassword("");
      setDisableCode("");
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Şifrə və ya kod səhvdir" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Təhlükəsizlik (2FA)</h1>

      {message && (
        <div
          className={`p-4 rounded-xl mb-6 ${
            message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-2">İki faktorlu autentifikasiya (2FA)</h3>
          <p className="text-slate-600 text-sm mb-4">
            Google Authenticator və ya başqa TOTP tətbiqi ilə girişi mühafizə edin.
          </p>

          {!setup ? (
            <button
              onClick={handleSetup}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? "..." : "2FA quraşdır"}
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                QR kodunu Google Authenticator və ya başqa tətbiqlə skan edin:
              </p>
              <div className="flex gap-4 items-start">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(setup.qrCodeUrl)}`}
                    alt="QR Code"
                    width={150}
                    height={150}
                  />
                </div>
                <div className="text-sm text-slate-600">
                  <p className="font-medium mb-1">Əllə daxil etsəniz:</p>
                  <code className="bg-slate-100 px-2 py-1 rounded">{setup.secret}</code>
                </div>
              </div>
              <form onSubmit={handleVerify} className="flex gap-2 items-end">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">6 rəqəmli kod</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                    className="border border-slate-300 rounded-lg px-3 py-2 w-32"
                    placeholder="000000"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || verifyCode.length !== 6}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  Təsdiq et
                </button>
                <button
                  type="button"
                  onClick={() => setSetup(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Ləğv
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-2">2FA deaktivləşdir</h3>
          <p className="text-slate-600 text-sm mb-4">
            Şifrə və cari 2FA kodunu daxil edin.
          </p>
          <form onSubmit={handleDisable} className="space-y-3 max-w-xs">
            <input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder="Şifrə"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
              placeholder="2FA kodu"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              2FA deaktivləşdir
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
