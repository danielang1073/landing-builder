export type HeroProps = {
  imageUrl: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  secondaryText: string;
  secondaryLinkText: string;
  secondaryLinkUrl: string;
  trustText: string;
};

export function Hero({
  imageUrl,
  eyebrow,
  title,
  description,
  ctaText,
  ctaUrl,
  secondaryText,
  secondaryLinkText,
  secondaryLinkUrl,
  trustText,
}: HeroProps) {
  return (
    <section className="hero">
      <div className="hero__inner">
        <div className="hero__image-wrap">
          {imageUrl && (
            <img src={imageUrl} alt="" className="hero__image" />
          )}
        </div>

        <div className="hero__content">
          {eyebrow && (
            <p className="hero__eyebrow">{eyebrow}</p>
          )}
          <h1 className="hero__title">{title}</h1>
          {description && (
            <p className="hero__description">{description}</p>
          )}
          {ctaText && (
            <div className="hero__cta-wrap">
              <a href={ctaUrl || "#"} className="gradient-hover-button">
                {ctaText} <span>→</span>
              </a>
            </div>
          )}
          {secondaryLinkText && (
            <p className="hero__secondary">
              {secondaryText && <span>{secondaryText} </span>}
              <a href={secondaryLinkUrl || "#"} className="hero__secondary-link">
                {secondaryLinkText}
              </a>
            </p>
          )}
        </div>
      </div>

      {trustText && (
        <div className="hero__trust">{trustText}</div>
      )}
    </section>
  );
}
