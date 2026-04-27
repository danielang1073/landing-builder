export type CardProps = {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  width?: string;
};

export function Card({ title, subtitle, imageUrl, width = "320px" }: CardProps) {
  return (
    <div className="card" style={{ width }}>
      {imageUrl && (
        <img src={imageUrl} alt={title} className="card__image" />
      )}
      <div className="card__body">
        <h3 className="card__title">{title}</h3>
        {subtitle && <p className="card__subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
