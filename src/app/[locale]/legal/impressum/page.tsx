import { useTranslations } from 'next-intl';
import styles from '../legal.module.css';

export default function ImpressumPage() {
  const t = useTranslations('legal');
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('impressum.title')}</h1>
      <div className={styles.content}>
        <section>
          <h2>Angaben gemäß § 5 TMG</h2>
          <p>
            Marie Lou Coffee<br />
            Marcel [Nachname]<br />
            [Straße und Hausnummer]<br />
            [PLZ] [Stadt]<br />
            Deutschland
          </p>
        </section>
        
        <section>
          <h2>Kontakt</h2>
          <p>
            E-Mail: hello@marieloucoffee.com<br />
            Telefon: [Telefonnummer]
          </p>
        </section>
        
        <section>
          <h2>Umsatzsteuer-ID</h2>
          <p>
            Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
            DE [Nummer]
          </p>
        </section>
        
        <section>
          <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <p>
            Marcel [Nachname]<br />
            [Adresse wie oben]
          </p>
        </section>
        
        <section>
          <h2>EU-Streitschlichtung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
            <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
              https://ec.europa.eu/consumers/odr/
            </a>
          </p>
          <p>Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
        </section>
        
        <section>
          <h2>Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
          <p>
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren 
            vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>
      </div>
    </div>
  );
}
