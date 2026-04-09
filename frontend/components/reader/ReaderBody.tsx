"use client"

import { ExternalLink, ImageOff } from "lucide-react"
import type { EmailRecord } from "@/lib/types"
import { copy } from "@/lib/copy"

/**
 * Props for the rich email body renderer.
 */
export interface ReaderBodyProps {
  email: EmailRecord
  showImages: boolean
  onLoadImages: () => void
}

export function ReaderBody({ email, showImages, onLoadImages }: ReaderBodyProps) {
  return (
    <div className="space-y-6 px-5 py-6">
      <p className="font-serif text-[20px] italic leading-7 text-text-primary dark:text-white">{email.greeting}</p>
      {email.orderedIntro?.length ? (
        <section className="rounded-xl border border-border bg-surface-raised p-4 dark:border-white/10 dark:bg-[#1c1c1c]">
          <ol className="space-y-3">
            {email.orderedIntro.map((item, index) => (
              <li key={item} className="flex gap-3 text-base text-text-secondary dark:text-text-muted">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <article className="space-y-4 text-[13px] leading-[1.7] text-text-secondary dark:text-text-muted">
        {email.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </article>
      {email.images?.length ? (
        <section className="space-y-4 rounded-xl border border-border bg-surface-raised p-4 dark:border-white/10 dark:bg-[#1c1c1c]">
          {!showImages ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 text-base text-text-secondary dark:text-text-muted">
                <ImageOff className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{copy.reader.imagesBlocked}</span>
              </div>
              <button className="focus-ring rounded-lg bg-brand px-4 py-2 text-base font-medium text-sidebar-bg" onClick={onLoadImages}>
                {copy.reader.loadImages}
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {email.images.map((image) => (
                <div key={image.src} className="overflow-hidden rounded-xl border border-border dark:border-white/10">
                  <img alt={image.alt} className="h-full w-full object-cover" height={420} loading="lazy" src={image.src} width={720} />
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
      {email.links.length ? (
        <section className="space-y-3">
          {email.links.map((link) => (
            <a
              key={link.href}
              aria-label={link.label}
              className="focus-ring inline-flex items-center gap-2 rounded-lg text-base font-medium text-brand underline decoration-brand/40 underline-offset-4"
              href={link.href}
              rel="noopener noreferrer nofollow"
              target="_blank"
            >
              {link.label}
              <ExternalLink className="h-4 w-4" />
            </a>
          ))}
        </section>
      ) : null}
    </div>
  )
}
