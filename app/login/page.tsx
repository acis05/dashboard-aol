import Image from "next/image";
import { redirect } from "next/navigation";
import { getAppSession } from "../../lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const session = await getAppSession().catch(() => null);
  if (session) redirect("/");
  return <main className="loginPage">
    <section className="loginVisual">
      <div className="loginGlow glowOne"/><div className="loginGlow glowTwo"/>
      <div className="brandStory">
        <Image src="/your-aol-dashboard-logo.png" width={490} height={145} alt="Your AOL Dashboard" className="loginLogo" priority/>
        <div className="loginEyebrow">FINANCIAL ANALYTICS FOR ACCURATE ONLINE</div>
        <h1>Data bisnis yang lebih mudah dibaca, dalam satu dashboard.</h1>
        <p>Masuk untuk melihat omzet, biaya, dan laba rugi dari database Accurate Online Anda.</p>
        <div className="featureChips"><span>OAuth 2.0</span><span>Read-only analytics</span><span>Custom date filters</span></div>
      </div>
    </section>
    <section className="loginPanel">
      <LoginForm/>
    </section>
  </main>;
}
