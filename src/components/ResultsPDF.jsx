import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#1f2937',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    marginBottom: 20,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#bfdbfe',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  scoreMax: {
    fontSize: 24,
    color: '#6b7280',
    marginLeft: 4,
  },
  scoreLabel: {
    marginLeft: 20,
    flex: 1,
  },
  scoreLabelText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  thresholdBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    padding: '4 8',
    borderRadius: 4,
  },
  thresholdRed: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
  },
  thresholdYellow: {
    backgroundColor: '#fefce8',
    color: '#ca8a04',
  },
  thresholdGreen: {
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  priorityNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
  },
  priorityTitle: {
    flex: 1,
    fontSize: 10,
  },
  priorityScore: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
  },
  areaTitle: {
    flex: 1,
    fontSize: 9,
  },
  areaScore: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusRed: {
    backgroundColor: '#dc2626',
  },
  statusYellow: {
    backgroundColor: '#eab308',
  },
  statusGreen: {
    backgroundColor: '#16a34a',
  },
  hoursBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    marginBottom: 20,
  },
  hoursLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  hoursValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginLeft: 10,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 9,
    color: '#6b7280',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
  },
  businessInfo: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  businessDetail: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
});

const getStatusStyle = (score, max) => {
  const percentage = (score / max) * 100;
  if (percentage <= 33) return styles.statusRed;
  if (percentage <= 66) return styles.statusYellow;
  return styles.statusGreen;
};

const getThresholdStyle = (key) => {
  if (key === 'red') return styles.thresholdRed;
  if (key === 'yellow') return styles.thresholdYellow;
  return styles.thresholdGreen;
};

export default function ResultsPDF({ results, areas, idTiquet }) {
  const { totalScore, globalThreshold, priorityAreas, areaScores } = results;
  const scorableAreas = areas.filter((a) => (a.max_score || 0) > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Informe de Diagnosi</Text>
          <Text style={styles.headerSubtitle}>Comerç a Punt - Barcelona Activa</Text>
          {idTiquet ? (
            <Text style={styles.headerSubtitle}>idTiquet: {idTiquet}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Puntuació Global</Text>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreNumber}>{totalScore}</Text>
            <Text style={styles.scoreMax}>/ 63</Text>
            <View style={styles.scoreLabel}>
              <Text style={styles.scoreLabelText}>Nivell de maduresa</Text>
              <Text style={[styles.thresholdBadge, getThresholdStyle(globalThreshold?.key)]}>
                {globalThreshold?.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.hoursBox}>
          <Text style={styles.hoursLabel}>Recomanació d'hores d'assessorament:</Text>
          <Text style={styles.hoursValue}>{globalThreshold?.recommended_hours} hores</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Les teves 3 àrees prioritàries</Text>
          {priorityAreas.map((area, idx) => (
            <View key={area.id} style={styles.priorityItem}>
              <Text style={styles.priorityNumber}>{idx + 1}</Text>
              <Text style={styles.priorityTitle}>{area.title}</Text>
              <Text style={styles.priorityScore}>{area.score}/9</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desglossament per àrees</Text>
          {scorableAreas.map(area => {
            const areaScore = areaScores[area.area];
            return (
              <View key={area.id} style={styles.areaRow}>
                <View style={[styles.statusDot, getStatusStyle(areaScore.score, areaScore.maxScore)]} />
                <Text style={styles.areaTitle}>{area.title}</Text>
                <Text style={styles.areaScore}>{areaScore.score}/{areaScore.maxScore}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.statusRed]} />
            <Text style={styles.legendText}>Prioritat ALTA (0-3)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.statusYellow]} />
            <Text style={styles.legendText}>Prioritat MITJANA (4-6)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.statusGreen]} />
            <Text style={styles.legendText}>Ben encaminat (7-9)</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Informe generat per Comerç a Punt - Barcelona Activa | {new Date().toLocaleDateString('ca-ES')}
        </Text>
      </Page>
    </Document>
  );
}
