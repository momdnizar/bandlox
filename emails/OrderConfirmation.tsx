import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface OrderConfirmationProps {
  orderNumber: string
  orderDate: string
  paymentStatus: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  shippingCity: string
  shippingState: string
  shippingPostalCode: string
  items: {
    image: string
    title: string
    variant: string | null
    quantity: number
    price: number
  }[]
  subtotal: number
  shipping: number
  total: number
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bandlox.in'

export default function OrderConfirmation({
  orderNumber,
  orderDate,
  paymentStatus,
  customerName,
  customerPhone,
  shippingAddress,
  shippingCity,
  shippingState,
  shippingPostalCode,
  items,
  subtotal,
  shipping,
  total,
}: OrderConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Bandlox order {orderNumber} is confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* ── Header ── */}
          <Section style={headerSection}>
            <Text style={logoText}>BANDLOX</Text>
            <Text style={tagline}>Luxury Redefined</Text>
          </Section>

          <Hr style={divider} />

          {/* ── Thank You ── */}
          <Section style={thankYouSection}>
            <Heading style={thankYouHeading}>Thank you for your order.</Heading>
            <Text style={thankYouText}>
              Hi {customerName}, we're thrilled to confirm your Bandlox
              order. Your luxury pieces are being prepared with the utmost care.
            </Text>
          </Section>

          {/* ── Order Details ── */}
          <Section style={detailsSection}>
            <Row style={detailRow}>
              <Column style={detailLabel}>Order Number</Column>
              <Column style={detailValue}>{orderNumber}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailLabel}>Order Date</Column>
              <Column style={detailValue}>{orderDate}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailLabel}>Payment Status</Column>
              <Column style={detailValue}>
                <span style={paidBadge}>{paymentStatus}</span>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* ── Ordered Items ── */}
          <Heading style={sectionHeading}>Items Ordered</Heading>
          {items.map((item, index) => (
            <Section key={index} style={itemSection}>
              <Row>
                <Column style={itemImageCol}>
                  <Img
                    src={item.image || `${baseUrl}/placeholder.svg`}
                    alt={item.title}
                    width="80"
                    height="80"
                    style={itemImage}
                  />
                </Column>
                <Column style={itemDetailsCol}>
                  <Text style={itemTitle}>{item.title}</Text>
                  {item.variant && (
                    <Text style={itemVariant}>Variant: {item.variant}</Text>
                  )}
                  <Text style={itemMeta}>
                    Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                  </Text>
                </Column>
                <Column style={itemPriceCol}>
                  <Text style={itemPrice}>
                    ₹{(item.quantity * item.price).toLocaleString('en-IN')}
                  </Text>
                </Column>
              </Row>
              {index < items.length - 1 && <Hr style={itemDivider} />}
            </Section>
          ))}

          <Hr style={divider} />

          {/* ── Summary ── */}
          <Section style={summarySection}>
            <Row style={summaryRow}>
              <Column style={summaryLabel}>Subtotal</Column>
              <Column style={summaryValue}>
                ₹{subtotal.toLocaleString('en-IN')}
              </Column>
            </Row>
            <Row style={summaryRow}>
              <Column style={summaryLabel}>Shipping</Column>
              <Column style={summaryValue}>
                {shipping === 0
                  ? 'FREE'
                  : `₹${shipping.toLocaleString('en-IN')}`}
              </Column>
            </Row>
            <Hr style={summaryDivider} />
            <Row style={summaryRow}>
              <Column style={totalLabel}>Total</Column>
              <Column style={totalValue}>
                ₹{total.toLocaleString('en-IN')}
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* ── Shipping Details ── */}
          <Heading style={sectionHeading}>Shipping Details</Heading>
          <Section style={shippingSection}>
            <Text style={shippingText}>{customerName}</Text>
            {customerPhone && (
              <Text style={shippingText}>{customerPhone}</Text>
            )}
            <Text style={shippingText}>{shippingAddress}</Text>
            <Text style={shippingText}>
              {shippingCity}, {shippingState} {shippingPostalCode}
            </Text>
          </Section>

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

const thankYouSection = {
  textAlign: 'center' as const,
  padding: '8px 0',
}

const thankYouHeading = {
  fontSize: '22px',
  fontWeight: '300',
  letterSpacing: '1px',
  color: '#000000',
  margin: '0 0 12px',
}

const thankYouText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#555555',
  margin: '0',
}

const detailsSection = {
  padding: '8px 0',
}

const detailRow = {
  marginBottom: '8px',
}

const detailLabel = {
  fontSize: '12px',
  fontWeight: '600',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  color: '#999999',
  width: '40%',
}

const detailValue = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#000000',
  width: '60%',
}

const paidBadge = {
  display: 'inline-block',
  padding: '2px 10px',
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  color: '#ffffff',
  backgroundColor: '#000000',
  borderRadius: '2px',
}

const sectionHeading = {
  fontSize: '13px',
  fontWeight: '700',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  color: '#000000',
  margin: '0 0 16px',
}

const itemSection = {
  padding: '4px 0',
}

const itemImageCol = {
  width: '80px',
  verticalAlign: 'top',
}

const itemImage = {
  borderRadius: '4px',
  objectFit: 'cover' as const,
}

const itemDetailsCol = {
  paddingLeft: '16px',
  verticalAlign: 'top',
}

const itemTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#000000',
  margin: '0 0 4px',
}

const itemVariant = {
  fontSize: '12px',
  color: '#888888',
  margin: '0 0 4px',
}

const itemMeta = {
  fontSize: '12px',
  color: '#888888',
  margin: '0',
}

const itemPriceCol = {
  width: '100px',
  textAlign: 'right' as const,
  verticalAlign: 'top',
}

const itemPrice = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#000000',
  margin: '0',
}

const itemDivider = {
  borderColor: '#f0f0f0',
  margin: '12px 0',
}

const summarySection = {
  padding: '8px 0',
}

const summaryRow = {
  marginBottom: '8px',
}

const summaryLabel = {
  fontSize: '13px',
  color: '#666666',
  width: '50%',
}

const summaryValue = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#000000',
  width: '50%',
  textAlign: 'right' as const,
}

const summaryDivider = {
  borderColor: '#cccccc',
  margin: '12px 0',
}

const totalLabel = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#000000',
  width: '50%',
}

const totalValue = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#000000',
  width: '50%',
  textAlign: 'right' as const,
}

const shippingSection = {
  padding: '8px 0',
}

const shippingText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#333333',
  margin: '0 0 2px',
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