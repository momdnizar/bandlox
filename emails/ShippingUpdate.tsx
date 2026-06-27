import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface ShippingUpdateProps {
  /** 'Packed' | 'Shipped' | 'Out For Delivery' | 'Delivered' */
  status: string
  orderNumber: string
  customerName: string
  /** Only provided when status === 'Shipped' */
  trackingNumber?: string
  /** Only provided when status === 'Shipped' */
  courierName?: string
  /** Only provided when status === 'Shipped' */
  trackingUrl?: string
  orderUrl: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bandlox.in'

const statusTitles: Record<string, { subject: string; preview: string; heading: string }> = {
  Packed: {
    subject: 'Your Bandlox Order Has Been Packed',
    preview: 'Your order is all packed and ready to go!',
    heading: 'Your order is packed.',
  },
  Shipped: {
    subject: 'Your Bandlox Order Has Been Shipped',
    preview: 'Your order is on its way!',
    heading: 'Your order has shipped.',
  },
  'Out For Delivery': {
    subject: 'Your Bandlox Order Is Out for Delivery',
    preview: 'Your order is out for delivery today!',
    heading: 'Your order is out for delivery.',
  },
  Delivered: {
    subject: 'Your Bandlox Order Has Been Delivered',
    preview: 'Your order has been delivered. Thank you!',
    heading: 'Your order has been delivered.',
  },
}

export default function ShippingUpdate({
  status,
  orderNumber,
  customerName,
  trackingNumber,
  courierName,
  trackingUrl,
  orderUrl,
}: ShippingUpdateProps) {
  const info = statusTitles[status] ?? statusTitles.Shipped

  return (
    <Html>
      <Head />
      <Preview>{info.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* ── Header ── */}
          <Section style={headerSection}>
            <Text style={logoText}>BANDLOX</Text>
            <Text style={tagline}>Luxury Redefined</Text>
          </Section>

          <Hr style={divider} />

          {/* ── Status Update ── */}
          <Section style={updateSection}>
            <Heading style={updateHeading}>{info.heading}</Heading>
            <Text style={updateText}>
              Hi {customerName}, we wanted to let you know that your Bandlox order{' '}
              <strong>{orderNumber}</strong> has been{' '}
              <strong>{status.toLowerCase()}</strong>.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* ── Tracking (Shipped only) ── */}
          {status === 'Shipped' && trackingNumber && (
            <Section style={trackingSection}>
              <Heading style={sectionHeading}>Tracking Information</Heading>

              {courierName && (
                <Section style={detailRow}>
                  <Text style={detailLabel}>Courier</Text>
                  <Text style={detailValue}>{courierName}</Text>
                </Section>
              )}

              <Section style={detailRow}>
                <Text style={detailLabel}>Tracking Number</Text>
                <Text style={detailValue}>{trackingNumber}</Text>
              </Section>

              {trackingUrl && (
                <Section style={buttonSection}>
                  <Link href={trackingUrl} style={button}>
                    Track Package
                  </Link>
                </Section>
              )}
            </Section>
          )}

          {/* ── Order Status Button ── */}
          <Section style={buttonSection}>
            <Link href={orderUrl} style={buttonSecondary}>
              View Order Status
            </Link>
          </Section>

          {status === 'Delivered' && (
            <Section style={thankYouSection}>
              <Text style={thankYouText}>
                Thank you for choosing Bandlox. We hope you love your luxury
                pieces. If you have any questions, please don't hesitate to
                reach out to our support team.
              </Text>
            </Section>
          )}

          <Hr style={divider} />

          {/* ── Footer ── */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Questions? Contact Bandlox support.
            </Text>
            <Text style={footerSmall}>
              Bandlox — Where luxury meets timeless elegance.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ── Styles ──

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
}

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '40px 24px',
}

const headerSection = {
  textAlign: 'center' as const,
  paddingBottom: '16px',
}

const logoText = {
  fontSize: '28px',
  fontWeight: '900',
  letterSpacing: '8px',
  color: '#000000',
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
}

const tagline = {
  fontSize: '11px',
  letterSpacing: '4px',
  color: '#999999',
  margin: '0',
  textTransform: 'uppercase' as const,
}

const divider = {
  borderColor: '#e5e5e5',
  margin: '24px 0',
}

const updateSection = {
  textAlign: 'center' as const,
  padding: '8px 0',
}

const updateHeading = {
  fontSize: '22px',
  fontWeight: '300',
  letterSpacing: '1px',
  color: '#000000',
  margin: '0 0 12px',
}

const updateText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#555555',
  margin: '0',
}

const trackingSection = {
  padding: '8px 0',
}

const sectionHeading = {
  fontSize: '13px',
  fontWeight: '700',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  color: '#000000',
  margin: '0 0 16px',
}

const detailRow = {
  marginBottom: '12px',
}

const detailLabel = {
  fontSize: '12px',
  fontWeight: '600',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  color: '#999999',
  margin: '0 0 4px',
}

const detailValue = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#000000',
  margin: '0',
}

const buttonSection = {
  textAlign: 'center' as const,
  padding: '16px 0',
}

const button = {
  display: 'inline-block',
  padding: '14px 32px',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  color: '#ffffff',
  backgroundColor: '#000000',
  borderRadius: '2px',
  textDecoration: 'none',
}

const buttonSecondary = {
  display: 'inline-block',
  padding: '12px 28px',
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  color: '#000000',
  border: '1px solid #000000',
  borderRadius: '2px',
  textDecoration: 'none',
}

const thankYouSection = {
  textAlign: 'center' as const,
  padding: '16px 0',
  backgroundColor: '#f9f9f9',
  borderRadius: '4px',
}

const thankYouText = {
  fontSize: '13px',
  lineHeight: '1.6',
  color: '#555555',
  margin: '0',
  padding: '0 16px',
}

const footerSection = {
  textAlign: 'center' as const,
  padding: '8px 0',
}

const footerText = {
  fontSize: '12px',
  color: '#888888',
  margin: '0 0 8px',
}

const footerSmall = {
  fontSize: '10px',
  letterSpacing: '1px',
  color: '#bbbbbb',
  margin: '0',
  textTransform: 'uppercase' as const,
}