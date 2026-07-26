import React from 'react';
import { StyleSheet, Text, View, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { spacing, radius } from '@/constants/design';
import { formatDate } from '@/utils/format';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.88;
const CARD_HEIGHT = CARD_WIDTH * 1.45; // Adjusted ratio for better look without QR

type DigitalIdCardProps = {
  student: {
    name: string;
    fatherName?: string;
    seatNumber?: string | number;
    id?: string | number;
    joiningDate?: string;
    profilePicture?: string;
    lastPayment?: {
        endDate?: string;
    };
  };
  company: {
    businessName: string;
    libraryLogo?: string;
    businessAddress?: string;
    contactNumber?: string;
  };
  theme: any;
};

export const DigitalIdCard = ({ student, company, theme }: DigitalIdCardProps) => {
  const validTill = student.lastPayment?.endDate ? formatDate(student.lastPayment.endDate) : 'N/A';

  return (
    <View style={[styles.cardContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      
      {/* Premium Header Section */}
      <View style={[styles.cardHeader, { backgroundColor: theme.primary }]}>
        <LinearGradient
            colors={[theme.primary, theme.primary + 'CC']}
            style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerContent}>
          <View style={styles.logoBox}>
            {company.libraryLogo ? (
                <Image source={{ uri: company.libraryLogo }} style={styles.logo} contentFit="contain" />
            ) : (
                <View style={styles.logoPlaceholder}>
                    <Ionicons name="library" size={20} color={theme.primary} />
                </View>
            )}
          </View>
          <View style={styles.headerTexts}>
            <Text style={styles.cardCompanyName} numberOfLines={1}>
                {company.businessName.toUpperCase()}
            </Text>
            <Text style={styles.cardIdLabel}>DIGITAL STUDENT PASSPORT</Text>
          </View>
        </View>
        <View style={[styles.headerCurve, { borderTopColor: theme.surface }]} />
      </View>

      {/* Main Content */}
      <View style={styles.body}>
        <View style={[styles.avatarFrame, { borderColor: theme.primary + '20' }]}>
          <Image
            source={{ uri: student.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'S')}&background=${theme.primary.replace('#','')}&color=fff&size=200` }}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>

        <View style={styles.studentMeta}>
          <Text style={[styles.studentName, { color: theme.text }]} numberOfLines={1}>
            {student.name || 'STUDENT NAME'}
          </Text>
          <View style={[styles.memberIdBadge, { backgroundColor: theme.primary + '10' }]}>
            <Text style={[styles.memberIdText, { color: theme.primary }]}>ID: #{student.id || '—'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Details Grid - More Spaced Out */}
        <View style={styles.detailsRow}>
          <DetailItem label="FATHER'S NAME" value={student.fatherName || '—'} theme={theme} />
          <DetailItem label="SEAT ASSIGNED" value={student.seatNumber ? `#${student.seatNumber}` : '—'} theme={theme} valueColor={theme.primary} />
        </View>

        <View style={[styles.detailsRow, { marginTop: 12 }]}>
          <DetailItem label="DATE OF JOINING" value={student.joiningDate ? formatDate(student.joiningDate) : '—'} theme={theme} />
          <DetailItem label="VALIDITY UPTO" value={validTill} theme={theme} valueColor={theme.success} />
        </View>

        {/* Branding Footer inside card */}
        <View style={styles.innerFooter}>
           <Image 
             source={{ uri: company.libraryLogo }} 
             style={{ width: 40, height: 40, opacity: 0.1, alignSelf: 'center' }} 
             contentFit="contain" 
           />
           <Text style={[styles.footerHint, { color: theme.muted }]}>Verified Educational Member</Text>
        </View>
      </View>

      {/* Extreme Bottom Bar */}
      <View style={[styles.cardFooter, { backgroundColor: theme.primary }]}>
        <Text style={styles.footerInfoText} numberOfLines={1}>
          {company.businessAddress || 'Official Membership'} • {company.contactNumber || 'System Verified'}
        </Text>
      </View>
    </View>
  );
};

const DetailItem = ({ label, value, theme, valueColor }: { label: string; value: string; theme: any; valueColor?: string }) => (
  <View style={styles.detailItem}>
    <Text style={[styles.itemLabel, { color: theme.muted }]}>{label}</Text>
    <Text style={[styles.itemValue, { color: valueColor || theme.text }]} numberOfLines={1}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    alignSelf: 'center',
    marginVertical: 10,
  },
  cardHeader: {
    height: '30%',
    padding: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 2,
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
  },
  cardCompanyName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardIdLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  headerCurve: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 20,
    zIndex: 1,
  },
  body: {
    flex: 1,
    paddingTop: 10,
    alignItems: 'center',
  },
  avatarFrame: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    padding: 4,
    backgroundColor: '#fff',
    marginTop: -55,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  studentMeta: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  studentName: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  memberIdBadge: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 30,
  },
  memberIdText: {
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 24,
  },
  detailsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 28,
    gap: 16,
  },
  detailItem: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  innerFooter: {
    marginTop: 'auto',
    marginBottom: 20,
    gap: 8,
  },
  footerHint: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cardFooter: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerInfoText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    opacity: 0.9,
  },
});
