import type { AuthoritativeSource } from "../types/questions";

/**
 * Central registry of authoritative sources. Every question links here via
 * sourceIds (assigned per-module and per-topic in the maps below).
 *
 * All URLs were verified as live official pages on the access date.
 * Rules applied: standards bodies, government agencies, official vendor
 * documentation, and official courses only — no blogs, no SEO articles,
 * no forums, no Wikipedia-as-primary, no exam dumps.
 */

const ACCESSED = "2026-07-07";

export const SOURCES: AuthoritativeSource[] = [
  /* ------------------------------ RFCs ----------------------------- */
  {
    id: "rfc-1034",
    title: "RFC 1034: Domain Names — Concepts and Facilities",
    organisation: "IETF",
    url: "https://www.rfc-editor.org/rfc/rfc1034",
    sourceType: "standard",
    topics: ["DNS", "name resolution"],
    accessedAt: ACCESSED,
    publishedAt: "1987-11",
    authorityReason:
      "The founding IETF standard defining the Domain Name System's concepts.",
  },
  {
    id: "rfc-2131",
    title: "RFC 2131: Dynamic Host Configuration Protocol",
    organisation: "IETF",
    url: "https://www.rfc-editor.org/rfc/rfc2131",
    sourceType: "standard",
    topics: ["DHCP", "address assignment", "DORA"],
    accessedAt: ACCESSED,
    publishedAt: "1997-03",
    authorityReason: "The IETF standard defining DHCP, including the DORA lease process.",
  },
  {
    id: "rfc-791",
    title: "RFC 791: Internet Protocol (IPv4)",
    organisation: "IETF",
    url: "https://www.rfc-editor.org/rfc/rfc791",
    sourceType: "standard",
    topics: ["IPv4", "IP addressing", "packets"],
    accessedAt: ACCESSED,
    publishedAt: "1981-09",
    authorityReason: "The IETF standard defining IPv4 addressing and the IP packet format.",
  },
  {
    id: "rfc-8200",
    title: "RFC 8200: Internet Protocol, Version 6 (IPv6) Specification",
    organisation: "IETF",
    url: "https://www.rfc-editor.org/rfc/rfc8200",
    sourceType: "standard",
    topics: ["IPv6"],
    accessedAt: ACCESSED,
    publishedAt: "2017-07",
    authorityReason: "The current IETF standard for IPv6 (obsoletes RFC 2460).",
  },
  {
    id: "rfc-826",
    title: "RFC 826: An Ethernet Address Resolution Protocol",
    organisation: "IETF",
    url: "https://www.rfc-editor.org/rfc/rfc826",
    sourceType: "standard",
    topics: ["ARP", "MAC addresses"],
    accessedAt: ACCESSED,
    publishedAt: "1982-11",
    authorityReason: "The IETF standard defining ARP (IP-to-MAC resolution).",
  },
  {
    id: "rfc-792",
    title: "RFC 792: Internet Control Message Protocol",
    organisation: "IETF",
    url: "https://www.rfc-editor.org/rfc/rfc792",
    sourceType: "standard",
    topics: ["ICMP", "ping", "traceroute"],
    accessedAt: ACCESSED,
    publishedAt: "1981-09",
    authorityReason: "The IETF standard defining ICMP, which ping and traceroute rely on.",
  },
  {
    id: "rfc-1918",
    title: "RFC 1918: Address Allocation for Private Internets",
    organisation: "IETF",
    url: "https://www.rfc-editor.org/rfc/rfc1918",
    sourceType: "standard",
    topics: ["private IP addresses", "NAT context"],
    accessedAt: ACCESSED,
    publishedAt: "1996-02",
    authorityReason: "The IETF standard reserving the private IPv4 address ranges.",
  },
  {
    id: "rfc-9293",
    title: "RFC 9293: Transmission Control Protocol (TCP)",
    organisation: "IETF",
    url: "https://www.rfc-editor.org/rfc/rfc9293",
    sourceType: "standard",
    topics: ["TCP", "three-way handshake", "reliability"],
    accessedAt: ACCESSED,
    publishedAt: "2022-08",
    authorityReason:
      "The current consolidated IETF TCP standard (obsoletes RFC 793).",
  },
  {
    id: "rfc-768",
    title: "RFC 768: User Datagram Protocol",
    organisation: "IETF",
    url: "https://www.rfc-editor.org/rfc/rfc768",
    sourceType: "standard",
    topics: ["UDP"],
    accessedAt: ACCESSED,
    publishedAt: "1980-08",
    authorityReason: "The IETF standard defining UDP.",
  },

  /* -------------------------- Official courses --------------------- */
  {
    id: "netacad-networking-basics",
    title: "Networking Basics (course)",
    organisation: "Cisco Networking Academy",
    url: "https://www.netacad.com/courses/networking-basics",
    sourceType: "official_course",
    topics: ["network types", "devices", "media", "protocols", "data flow"],
    accessedAt: ACCESSED,
    authorityReason:
      "Cisco's official free introductory networking course; public learning objectives used as a syllabus reference.",
  },
  {
    id: "netacad-packet-tracer",
    title: "Getting Started with Cisco Packet Tracer (course)",
    organisation: "Cisco Networking Academy",
    url: "https://www.netacad.com/courses/getting-started-cisco-packet-tracer",
    sourceType: "official_course",
    topics: ["network simulation", "topology building", "device configuration"],
    accessedAt: ACCESSED,
    authorityReason:
      "Cisco's official course for its network simulation tool.",
  },
  {
    id: "ms-network-fundamentals",
    title: "Fundamentals of computer networking (training module)",
    organisation: "Microsoft Learn",
    url: "https://learn.microsoft.com/en-us/training/modules/network-fundamentals/",
    sourceType: "official_course",
    topics: ["network types", "topologies", "protocols", "IP addressing"],
    accessedAt: ACCESSED,
    authorityReason:
      "Microsoft's official free training module on networking fundamentals.",
  },
  {
    id: "ms-network-security-fundamentals",
    title: "Fundamentals of network security (training module)",
    organisation: "Microsoft Learn",
    url: "https://learn.microsoft.com/en-us/training/modules/network-fundamentals-2/",
    sourceType: "official_course",
    topics: ["network security", "firewalls", "monitoring"],
    accessedAt: ACCESSED,
    authorityReason:
      "Microsoft's official training module on network security basics.",
  },

  /* ---------------------- Official documentation ------------------- */
  {
    id: "ms-tcpip-subnetting",
    title: "Understand TCP/IP addressing and subnetting basics",
    organisation: "Microsoft Learn",
    url: "https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/tcpip-addressing-and-subnetting",
    sourceType: "official_documentation",
    topics: ["IPv4", "subnet masks", "default gateways", "subnetting"],
    accessedAt: ACCESSED,
    authorityReason:
      "Microsoft's official reference for TCP/IP addressing and subnetting.",
  },
  {
    id: "cisco-switch-vs-router",
    title: "What is a Switch vs a Router?",
    organisation: "Cisco",
    url: "https://www.cisco.com/site/us/en/learn/topics/small-business/network-switch-vs-router.html",
    sourceType: "official_documentation",
    topics: ["switches", "routers", "access points", "network devices"],
    accessedAt: ACCESSED,
    authorityReason:
      "Official Cisco explanation of core network device roles.",
  },
  {
    id: "gns3-docs",
    title: "GNS3 Documentation",
    organisation: "GNS3",
    url: "https://docs.gns3.com/",
    sourceType: "official_documentation",
    topics: ["network simulation", "topology building", "device emulation"],
    accessedAt: ACCESSED,
    authorityReason: "The official documentation of the GNS3 network simulator.",
  },
  {
    id: "wifi-alliance-security",
    title: "Wi-Fi Security (WPA3)",
    organisation: "Wi-Fi Alliance",
    url: "https://www.wi-fi.org/discover-wi-fi/security",
    sourceType: "standard",
    topics: ["Wi-Fi", "WPA2", "WPA3", "wireless security"],
    accessedAt: ACCESSED,
    authorityReason:
      "The Wi-Fi Alliance certifies Wi-Fi security standards including WPA3.",
  },

  /* --------------------------- Government -------------------------- */
  {
    id: "nist-csf",
    title: "NIST Cybersecurity Framework",
    organisation: "NIST",
    url: "https://www.nist.gov/cyberframework",
    sourceType: "government",
    topics: ["security frameworks", "risk management", "security policies"],
    accessedAt: ACCESSED,
    authorityReason:
      "The U.S. national standards body's cybersecurity framework, an industry-wide reference.",
  },
  {
    id: "nist-800-207",
    title: "NIST SP 800-207: Zero Trust Architecture",
    organisation: "NIST",
    url: "https://csrc.nist.gov/pubs/sp/800/207/final",
    sourceType: "government",
    topics: ["Zero Trust", "access control", "authentication"],
    accessedAt: ACCESSED,
    publishedAt: "2020-08",
    authorityReason: "The definitive government publication defining Zero Trust architecture.",
  },
  {
    id: "cisa-best-practices",
    title: "Cybersecurity Best Practices",
    organisation: "CISA",
    url: "https://www.cisa.gov/topics/cybersecurity-best-practices",
    sourceType: "government",
    topics: ["phishing", "malware", "ransomware", "MFA", "patching"],
    accessedAt: ACCESSED,
    authorityReason:
      "The U.S. Cybersecurity and Infrastructure Security Agency's official guidance.",
  },
  {
    id: "cisa-network-devices",
    title: "Securing Network Infrastructure Devices",
    organisation: "CISA",
    url: "https://www.cisa.gov/news-events/news/securing-network-infrastructure-devices",
    sourceType: "government",
    topics: ["device hardening", "segmentation", "network infrastructure security"],
    accessedAt: ACCESSED,
    authorityReason:
      "Official CISA guidance on hardening routers, switches, and firewalls.",
  },

  /* ------------------------------ Cloud ---------------------------- */
  {
    id: "aws-vpc-docs",
    title: "What is Amazon VPC? (User Guide)",
    organisation: "Amazon Web Services",
    url: "https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html",
    sourceType: "official_documentation",
    topics: ["VPC", "cloud subnets", "route tables", "security groups"],
    accessedAt: ACCESSED,
    authorityReason: "AWS's official documentation for Virtual Private Cloud.",
  },
  {
    id: "azure-vnet-docs",
    title: "Azure Virtual Network overview",
    organisation: "Microsoft Azure",
    url: "https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-overview",
    sourceType: "official_documentation",
    topics: ["virtual networks", "NSGs", "cloud networking"],
    accessedAt: ACCESSED,
    authorityReason: "Microsoft's official documentation for Azure Virtual Network.",
  },
  {
    id: "gcp-vpc-docs",
    title: "VPC network overview",
    organisation: "Google Cloud",
    url: "https://cloud.google.com/vpc/docs/overview",
    sourceType: "official_documentation",
    topics: ["VPC", "cloud subnets", "global networking"],
    accessedAt: ACCESSED,
    authorityReason: "Google's official documentation for Virtual Private Cloud.",
  },
  {
    id: "aws-global-infrastructure",
    title: "AWS Global Infrastructure (Regions & Availability Zones)",
    organisation: "Amazon Web Services",
    url: "https://aws.amazon.com/about-aws/global-infrastructure/",
    sourceType: "official_documentation",
    topics: ["regions", "availability zones", "data centres", "high availability"],
    accessedAt: ACCESSED,
    authorityReason:
      "AWS's official description of its regions, availability zones, and data centres.",
  },

  /* ----------------------- Architecture frameworks ----------------- */
  {
    id: "aws-well-architected",
    title: "AWS Well-Architected Framework",
    organisation: "Amazon Web Services",
    url: "https://aws.amazon.com/architecture/well-architected/",
    sourceType: "architecture_framework",
    topics: ["solution design", "reliability", "cost", "trade-offs", "security"],
    accessedAt: ACCESSED,
    authorityReason:
      "AWS's official framework for designing and evaluating cloud architectures.",
  },
  {
    id: "ms-caf-networking",
    title: "Cloud Adoption Framework: Network topology and connectivity",
    organisation: "Microsoft Learn",
    url: "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/design-area/network-topology-and-connectivity",
    sourceType: "architecture_framework",
    topics: ["hybrid networking", "network design", "requirements mapping"],
    accessedAt: ACCESSED,
    authorityReason:
      "Microsoft's official framework guidance for cloud/hybrid network design decisions.",
  },
  {
    id: "aws-sa-associate",
    title: "AWS Certified Solutions Architect – Associate",
    organisation: "Amazon Web Services",
    url: "https://aws.amazon.com/certification/certified-solutions-architect-associate/",
    sourceType: "official_career_page",
    topics: ["solutions architect role", "requirements mapping", "customer solution design"],
    accessedAt: ACCESSED,
    authorityReason:
      "An established professional certification body's official description of solution-design competencies.",
  },
];

export const SOURCES_BY_ID: Map<string, AuthoritativeSource> = new Map(
  SOURCES.map((s) => [s.id, s])
);

/* ------------------------------------------------------------------ */
/* Module → sources (applied by the course builder)                    */
/* ------------------------------------------------------------------ */

export const MODULE_SOURCES: Record<string, string[]> = {
  /* Networking Foundations */
  "nb-networks": ["netacad-networking-basics", "ms-network-fundamentals"],
  "nb-components": ["netacad-networking-basics", "cisco-switch-vs-router", "ms-network-fundamentals"],
  "nb-media": ["netacad-networking-basics", "ms-network-fundamentals", "wifi-alliance-security"],
  "nb-protocols": ["netacad-networking-basics", "ms-network-fundamentals", "ms-tcpip-subnetting"],
  "nb-dataflow": ["netacad-networking-basics", "rfc-791", "ms-network-fundamentals"],
  "nb-config-security": ["netacad-networking-basics", "cisa-best-practices"],

  /* Network Devices and Infrastructure */
  "hw-core-devices": ["cisco-switch-vs-router", "ms-network-fundamentals"],
  "hw-servers-endpoints": ["ms-network-fundamentals", "aws-global-infrastructure"],
  "hw-ports": ["cisco-switch-vs-router", "netacad-networking-basics"],
  "hw-cabling": ["netacad-networking-basics", "ms-network-fundamentals"],
  "hw-power": ["aws-global-infrastructure", "cisa-network-devices"],
  "hw-environments": ["aws-global-infrastructure", "ms-caf-networking"],

  /* IP Addressing & Troubleshooting */
  "ip-addressing": ["ms-tcpip-subnetting", "rfc-791", "rfc-1918"],
  "ip-services": ["rfc-2131", "rfc-1034", "rfc-826"],
  "ip-tools": ["rfc-792", "ms-tcpip-subnetting"],
  "ts-symptoms": ["ms-tcpip-subnetting", "rfc-2131", "rfc-1034"],
  "ts-performance": ["ms-network-fundamentals", "wifi-alliance-security"],
  "ts-method": ["ms-network-fundamentals", "netacad-networking-basics"],

  /* Network Configuration and Simulation */
  "pt-devices-cables": ["netacad-packet-tracer", "gns3-docs", "cisco-switch-vs-router"],
  "pt-addressing": ["netacad-packet-tracer", "ms-tcpip-subnetting"],
  "pt-connectivity": ["netacad-packet-tracer", "rfc-792", "gns3-docs"],
  "pt-errors-vlans": ["netacad-packet-tracer", "gns3-docs", "wifi-alliance-security"],

  /* Network Security Fundamentals */
  "sec-perimeter": ["ms-network-security-fundamentals", "cisa-network-devices"],
  "sec-access": ["nist-800-207", "cisa-best-practices"],
  "sec-network": ["cisa-network-devices", "nist-800-207", "wifi-alliance-security"],
  "sec-threats": ["cisa-best-practices", "nist-csf"],
  "sec-data-cloud": ["nist-csf", "cisa-best-practices", "aws-well-architected"],

  /* Cloud and Hybrid Networking */
  "cloud-virtual-networks": ["aws-vpc-docs", "azure-vnet-docs", "gcp-vpc-docs"],
  "cloud-security-delivery": ["aws-vpc-docs", "azure-vnet-docs", "aws-well-architected"],
  "cloud-hybrid-connectivity": ["ms-caf-networking", "aws-global-infrastructure", "aws-vpc-docs"],

  /* Solution Engineer Customer Scenarios */
  "se-discovery": ["aws-well-architected", "aws-sa-associate"],
  "se-diagnosis": ["ms-tcpip-subnetting", "rfc-1034", "ms-network-fundamentals"],
  "se-solutioning": ["aws-well-architected", "ms-caf-networking", "aws-sa-associate"],
  "se-communication": ["aws-well-architected", "aws-sa-associate"],
  "se-objections": ["aws-well-architected", "ms-caf-networking"],
  "se-architecture-demo": ["nist-800-207", "aws-well-architected", "cisa-network-devices"],
};

/* Topic-level refinements: protocol questions cite their RFC directly. */
export const TOPIC_SOURCES: Record<string, string[]> = {
  DNS: ["rfc-1034"],
  DHCP: ["rfc-2131"],
  IPv4: ["rfc-791"],
  "IP Addressing": ["rfc-791", "rfc-1918"],
  "IP Addresses": ["rfc-791"],
  "Public & Private IPs": ["rfc-1918"],
  Subnets: ["ms-tcpip-subnetting"],
  "Subnet Masks": ["ms-tcpip-subnetting"],
  Subnetting: ["ms-tcpip-subnetting"],
  ARP: ["rfc-826"],
  ICMP: ["rfc-792"],
  Ping: ["rfc-792"],
  Traceroute: ["rfc-792"],
  "TCP & UDP": ["rfc-9293", "rfc-768"],
  "TCP/UDP": ["rfc-9293", "rfc-768"],
  NAT: ["rfc-1918"],
  "Wi-Fi": ["wifi-alliance-security"],
  "Wi-Fi Signal": ["wifi-alliance-security"],
  "Wireless Setup": ["wifi-alliance-security"],
  Wireless: ["wifi-alliance-security"],
  "Zero Trust": ["nist-800-207"],
  MFA: ["cisa-best-practices", "nist-800-207"],
};

/** All sources for a question id set, resolved and de-duplicated. */
export function resolveSources(sourceIds: string[]): AuthoritativeSource[] {
  const seen = new Set<string>();
  const out: AuthoritativeSource[] = [];
  for (const id of sourceIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const s = SOURCES_BY_ID.get(id);
    if (s) out.push(s);
  }
  return out;
}

export const SUPPLEMENTARY_DISCLAIMER =
  "This application provides independently created supplementary practice. It is not an official assessment and is not endorsed by the source organisations listed.";
