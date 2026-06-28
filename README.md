# RedPath-Sentinel
Interactive attack surface visualization platform that imports Nmap XML scans to map hosts, services, vulnerabilities, and Active Directory attack paths.

# What is RedPath Sentinel?

RedPath Sentinel is a cybersecurity portfolio project that visualizes network reconnaissance and identity attack paths in a homelab environment.
<img width="1545" height="811" alt="Overall diagram" src="https://github.com/user-attachments/assets/caca234f-7783-420f-a01f-80b975b29427" />

The tool imports Nmap XML scan results, maps discovered hosts and services into an interactive topology graph, and highlights potential weaknesses such as exposed SMB, LDAP, Kerberos, WinRM, and DNS services. It also includes a hack difficulty score to help evaluate target exposure based on open ports, service types, identity risk indicators, and known attack-path concepts.
<img width="1005" height="803" alt="Services" src="https://github.com/user-attachments/assets/ea0ab6e2-6121-4e92-9a3e-7526a2551ff1" />

## Features

- Nmap XML scan import
- Interactive topology graph
- Host, service, user, group, and weakness nodes
- Active Directory service detection
- MITRE ATT&CK-style weakness mapping
- Hack difficulty scoring
- Right-side node details panel
- Dark security dashboard interface
<img width="1570" height="565" alt="Identities" src="https://github.com/user-attachments/assets/0df1012e-1775-4a72-ba7e-8d8281e67c75" />

## Lab Workflow

1. Run an Nmap scan from a Kali VM.
2. Export the scan as XML.
3. Upload the XML into RedPath Sentinel.
4. Review discovered hosts, services, weaknesses, and attack-path indicators.
<img width="1480" height="831" alt="Attack Path Simulator" src="https://github.com/user-attachments/assets/90b27312-1532-40dd-a78b-4c82b03c69c1" />

## Disclaimer

This project is for authorized homelab and educational use only. It is not intended for unauthorized scanning or exploitation.
