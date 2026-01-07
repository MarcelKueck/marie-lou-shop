import { useTranslations } from 'next-intl';
import styles from '../legal.module.css';

export default function DatenschutzPage() {
  const t = useTranslations('legal');
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('datenschutz.title')}</h1>
      <div className={styles.content}>
        <section>
          <h2>1. Datenschutz auf einen Blick</h2>
          <h3>Allgemeine Hinweise</h3>
          <p>
            Die folgenden Hinweise geben einen einfachen Überblick darüber, 
            was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen.
          </p>
        </section>
        
        <section>
          <h2>2. Allgemeine Hinweise und Pflichtinformationen</h2>
          <h3>Datenschutz</h3>
          <p>
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. 
            Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der 
            gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
          </p>
        </section>
        
        <section>
          <h2>3. Datenerfassung auf dieser Website</h2>
          <h3>Cookies</h3>
          <p>
            Unsere Website verwendet Cookies. Das sind kleine Textdateien, die Ihr Webbrowser 
            auf Ihrem Endgerät speichert. Cookies helfen uns dabei, unser Angebot 
            nutzerfreundlicher und effektiver zu gestalten.
          </p>
          
          <h3>Kontaktformular</h3>
          <p>
            Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben 
            aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten 
            zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert.
          </p>
        </section>
        
        <section>
          <h2>4. Analyse-Tools und Werbung</h2>
          <p>
            Diese Website verwendet keine Analyse-Tools von Drittanbietern.
          </p>
        </section>
        
        <section>
          <h2>5. Plugins und Tools</h2>
          <h3>Stripe</h3>
          <p>
            Für Zahlungsvorgänge nutzen wir den Dienst Stripe. Anbieter ist die 
            Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, Irland.
          </p>
        </section>
        
        <section>
          <h2>6. Ihre Rechte</h2>
          <p>
            Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten 
            personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der 
            Datenverarbeitung sowie ein Recht auf Berichtigung oder Löschung dieser Daten.
          </p>
        </section>
      </div>
    </div>
  );
}
