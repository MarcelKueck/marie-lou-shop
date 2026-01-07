import { useTranslations } from 'next-intl';
import styles from '../legal.module.css';

export default function WiderrufPage() {
  const t = useTranslations('legal');
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('widerruf.title')}</h1>
      <div className={styles.content}>
        <section>
          <h2>Widerrufsrecht</h2>
          <p>
            Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen 
            diesen Vertrag zu widerrufen.
          </p>
          <p>
            Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein 
            von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren 
            in Besitz genommen haben bzw. hat.
          </p>
          <p>
            Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Marie Lou Coffee, 
            [Adresse], E-Mail: hello@marieloucoffee.com) mittels einer eindeutigen 
            Erklärung (z. B. ein mit der Post versandter Brief oder E-Mail) über 
            Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.
          </p>
        </section>
        
        <section>
          <h2>Folgen des Widerrufs</h2>
          <p>
            Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, 
            die wir von Ihnen erhalten haben, einschließlich der Lieferkosten 
            (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass 
            Sie eine andere Art der Lieferung als die von uns angebotene, günstigste 
            Standardlieferung gewählt haben), unverzüglich und spätestens binnen 
            vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über 
            Ihren Widerruf dieses Vertrags bei uns eingegangen ist.
          </p>
          <p>
            Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie 
            bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit 
            Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden 
            Ihnen wegen dieser Rückzahlung Entgelte berechnet.
          </p>
        </section>
        
        <section>
          <h2>Ausschluss des Widerrufsrechts</h2>
          <p>
            Das Widerrufsrecht besteht nicht bei Verträgen zur Lieferung von Waren, 
            die nicht vorgefertigt sind und für deren Herstellung eine individuelle 
            Auswahl oder Bestimmung durch den Verbraucher maßgeblich ist oder die 
            eindeutig auf die persönlichen Bedürfnisse des Verbrauchers zugeschnitten sind.
          </p>
          <p>
            Bei Kaffee, der nach Bestellung frisch geröstet wird, kann das Widerrufsrecht 
            eingeschränkt sein.
          </p>
        </section>
        
        <section>
          <h2>Muster-Widerrufsformular</h2>
          <p>
            (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses 
            Formular aus und senden Sie es zurück.)
          </p>
          <ul>
            <li>An: Marie Lou Coffee, [Adresse], E-Mail: hello@marieloucoffee.com</li>
            <li>Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen 
                Vertrag über den Kauf der folgenden Waren (*)</li>
            <li>Bestellt am (*)/erhalten am (*)</li>
            <li>Name des/der Verbraucher(s)</li>
            <li>Anschrift des/der Verbraucher(s)</li>
            <li>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)</li>
            <li>Datum</li>
          </ul>
          <p>(*) Unzutreffendes streichen.</p>
        </section>
      </div>
    </div>
  );
}
