import Image from "next/image";
import { Syne } from "next/font/google";

const syne = Syne({ subsets: ["latin"], weight: ["400"] });

export function MelnoLogo() {
  return (
    <div className={`flex items-center gap-2.5 ${syne.className}`}>
      <Image src="/logo-icon.png" width={30} height={30} alt="Melno" className="rounded-full" />
      <span className="text-base text-zinc-100" style={{ letterSpacing: "-0.03em", fontWeight: 400 }}>
        melno
      </span>
    </div>
  );
}
