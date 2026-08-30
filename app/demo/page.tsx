import { LayeredText } from "@/components/ui/layered-text"

const kayaraLines = [
  { top: "\u00A0", bottom: "日本語" },
  { top: "日本語", bottom: "桜" },
  { top: "桜", bottom: "練習" },
  { top: "練習", bottom: "合格" },
  { top: "合格", bottom: "未来" },
  { top: "未来", bottom: "KAYARA" },
  { top: "KAYARA", bottom: "\u00A0" },
]

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#FFFBEB] dark:bg-[#0C0A09] flex flex-col items-center justify-center p-4 gap-12">
      <div className="text-center">
        <p className="text-xs tracking-[0.2em] uppercase text-zinc-500 dark:text-zinc-400 mb-6">Default demo</p>
        <LayeredText />
      </div>
      <div className="text-center border-t border-zinc-200 dark:border-white/10 pt-12 w-full max-w-4xl">
        <p className="text-xs tracking-[0.2em] uppercase text-zinc-500 dark:text-zinc-400 mb-6">Kayara Japanese — hover untuk animasi GSAP</p>
        <LayeredText lines={kayaraLines} fontSize="64px" fontSizeMd="32px" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-8 max-w-[60ch] mx-auto leading-6">
          Best place di Kayara: ganti hero <span className="font-mono text-xs bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 rounded">Latihan JLPT...</span> dengan versi ini biar ada wow isometric + sakura. Hover untuk trigger GSAP timeline.
        </p>
      </div>
    </div>
  )
}
