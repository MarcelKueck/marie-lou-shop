import { useTranslations } from 'next-intl';
import styles from '../legal.module.css';

export default function AGBPage() {
  const t = useTranslations('legal');
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('agb.title')}</h1>
      <div className={styles.content}>
        <section>
          <h2>§1 Geltungsbereich</h2>
          <p>
            Diese Allgemeinen Geschäftsbedingungen gelten für alle Bestellungen, 
            die Verbraucher und Unternehmer über unseren Online-Shop abschließen.
          </p>
        </section>
        
        <section>
          <h2>§2 Vertragspartner</h2>
          <p>
            Der Kaufvertrag kommt zustande mit Marie Lou Coffee, 
            vertreten durch Marcel [Nachname], [Adresse].
          </p>
        </section>
        
        <section>
          <h2>§3 Vertragsschluss</h2>
          <p>
            Die Darstellung der Produkte im Online-Shop stellt kein rechtlich 
            bindendes Angebot, sondern einen unverbindlichen Online-Katalog dar.
          </p>
          <p>
            Durch Anklicken des Buttons &quot;Zahlungspflichtig bestellen&quot; geben Sie 
            eine verbindliche Bestellung der im Warenkorb enthaltenen Waren ab.
          </p>
        </section>
        
        <section>
          <h2>§4 Preise und Versandkosten</h2>
          <p>
            Die auf den Produktseiten genannten Preise enthalten die gesetzliche 
            Mehrwertsteuer und sonstige Preisbestandteile.
          </p>
          <p>
            Zusätzlich zu den angegebenen Preisen berechnen wir für die Lieferung 
            Versandkosten, die vor Abgabe der Bestellung deutlich mitgeteilt werden.
          </p>
        </section>
        
        <section>
          <h2>§5 Lieferung</h2>
          <p>
            Die Lieferung erfolgt an die vom Kunden angegebene Lieferadresse.
            Wir liefern nur innerhalb der auf unserer Website angegebenen Länder.
          </p>
        </section>
        
        <section>
          <h2>§6 Zahlung</h2>
          <p>
            Die Zahlung erfolgt wahlweise per Kreditkarte, SEPA-Lastschrift oder Klarna.
          </p>
        </section>
        
        <section>
          <h2>§7 Eigentumsvorbehalt</h2>
          <p>
            Bis zur vollständigen Zahlung bleibt die Ware unser Eigentum.
          </p>
        </section>
        
        <section>
          <h2>§8 Widerrufsrecht</h2>
          <p>
            Als Verbraucher haben Sie ein vierzehntägiges Widerrufsrecht. 
            Einzelheiten hierzu finden Sie in unserer Widerrufsbelehrung.
          </p>
        </section>
        
        <section>
          <h2>§9 Gewährleistung</h2>
          <p>
            Es gelten die gesetzlichen Gewährleistungsrechte.
          </p>
        </section>
        
        <section>
          <h2>§10 Schlussbestimmungen</h2>
          <p>
            Es gilt deutsches Recht. Gerichtsstand ist, soweit gesetzlich zulässig, 
            unser Geschäftssitz.
          </p>
        </section>
      </div>
    </div>
  );
}
