import { LuClipboardList } from "react-icons/lu";
import { LuPhone } from "react-icons/lu";
import { LuStar } from "react-icons/lu";
import { IconType } from "react-icons";

export type HeaderProps = {
  logo1Url: string;
  logo2Url: string;
  nav1Text: string;
  nav1Url: string;
  nav2Text: string;
  nav2Url: string;
  nav3Text: string;
  nav3Url: string;
  phoneLabel: string;
  phoneNumber: string;
};

const NAV_ICONS: IconType[] = [LuClipboardList, LuPhone, LuStar];

export function Header({
  logo1Url,
  logo2Url,
  nav1Text,
  nav1Url,
  nav2Text,
  nav2Url,
  nav3Text,
  nav3Url,
  phoneLabel,
  phoneNumber,
}: HeaderProps) {
  const navLinks = [
    { text: nav1Text, url: nav1Url },
    { text: nav2Text, url: nav2Url },
    { text: nav3Text, url: nav3Url },
  ];

  return (
    <header className="header">
      <div className="header__logos">
        {logo1Url && (
          <img src={logo1Url} alt="Logo principal" className="header__logo" />
        )}
        {logo2Url && (
          <img src={logo2Url} alt="Logo secundario" className="header__logo" />
        )}
      </div>

      <nav className="header__nav">
        {navLinks.map(({ text, url }, i) => {
          const Icon = NAV_ICONS[i];
          return text ? (
            <a key={text} href={url || "#"} className="header__nav-link">
              <Icon size={16} />
              {text}
            </a>
          ) : null;
        })}
      </nav>

      <div className="header__phone">
        {phoneLabel && <p className="header__phone-label">{phoneLabel}</p>}
        {phoneNumber && <p className="header__phone-number">{phoneNumber}</p>}
      </div>
    </header>
  );
}
