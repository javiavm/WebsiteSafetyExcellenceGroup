# 20-Point Data Center Safety Checklist

**For Construction & Operations Teams at Hyperscale Facilities**

*A comprehensive safety verification guide based on NFPA 70E, OSHA 29 CFR 1926, and industry best practices*

---

## Why This Matters

Data center construction operates at hyperscale speed with hyperscale consequences:
- **One arc flash event can delay a $500M project by 6+ months**
- **Electrical incidents account for 63% of data center construction fatalities**
- **The average cost of a serious injury: $1.2M in direct + indirect costs**

This checklist identifies the 20 most critical safety verification points for data center construction and commissioning.

---

## Section 1: Electrical Safety Program (NFPA 70E)

### 1. Arc Flash Risk Assessment Complete

**Standard:** NFPA 70E Article 130.5

**Verify:**
- [ ] Arc flash risk assessment performed by qualified engineer
- [ ] Incident energy calculations documented for all equipment >240V
- [ ] Labels installed on all applicable panels, switchgear, and transformers
- [ ] Assessment updated within last 5 years or after modifications

**Why it matters:** Arc flash in data center environments can release up to 40 cal/cm² of incident energy. Without proper assessment, workers cannot select appropriate PPE.

---

### 2. Energized Electrical Work Permit (EEWP) Process

**Standard:** NFPA 70E Article 130.2

**Verify:**
- [ ] EEWP required for any work on energized equipment >50V
- [ ] Permits require justified business necessity documentation
- [ ] Permits reviewed and signed by qualified person
- [ ] Permits specify exact PPE category, AFB, and shock approach boundaries
- [ ] No "blanket permits" - each task requires specific authorization

**Why it matters:** Data center commissioning frequently requires energized work. Without formal permit process, workers default to unsafe practices.

---

### 3. PPE Selection and Availability

**Standard:** NFPA 70E Article 130.5, Table 130.5(G)

**Verify:**
- [ ] Arc-rated PPE available in Categories 1-4
- [ ] Face shields + balaclava or arc flash hoods for Category 2+
- [ ] Voltage-rated gloves available per Table 130.7(C)(15)(a)
- [ ] Glove inspection logs current (before each use + 6-month testing)
- [ ] All PPE within manufacturer expiration dates

**Why it matters:** 85% of electrical burn victims were wearing inadequate or no arc-rated PPE.

---

### 4. Qualified Person Verification

**Standard:** NFPA 70E Article 100

**Verify:**
- [ ] Documented training records for all electrical workers
- [ ] Training specific to equipment types on site
- [ ] Demonstrated competency (not just course completion)
- [ ] Annual refresher training documented
- [ ] Workers can articulate shock + arc flash boundaries for their tasks

**Why it matters:** A "qualified person" isn't just licensed - they must have training AND demonstrated skills for specific equipment.

---

## Section 2: Lockout/Tagout Program (OSHA 1910.147)

### 5. Equipment-Specific LOTO Procedures

**Standard:** OSHA 29 CFR 1910.147(c)(4)

**Verify:**
- [ ] Written procedure for each equipment type requiring LOTO
- [ ] Procedures include all energy sources (electrical, pneumatic, hydraulic, mechanical, thermal)
- [ ] Data center-specific: UPS bypass procedures documented
- [ ] Data center-specific: Generator and ATS isolation procedures documented
- [ ] Procedures accessible at point of work

**Why it matters:** Data centers have complex energy sources including battery banks (DC), redundant feeders, and automatic transfer systems that can unexpectedly re-energize equipment.

---

### 6. Group LOTO for Complex Servicing

**Standard:** OSHA 29 CFR 1910.147(f)(3)

**Verify:**
- [ ] Group lockout procedure established for multi-worker tasks
- [ ] Primary authorized employee designated
- [ ] Individual lockout devices for each worker
- [ ] Shift change procedures documented
- [ ] Communication protocol when authorized employees change

**Why it matters:** Data center commissioning involves multiple crews. Group LOTO prevents tragic miscommunication.

---

### 7. Periodic Inspection of LOTO Procedures

**Standard:** OSHA 29 CFR 1910.147(c)(6)

**Verify:**
- [ ] Annual inspection of each procedure by authorized employee
- [ ] Inspection conducted by someone other than the person being evaluated
- [ ] Certification documents current (procedure name, date, inspector name)
- [ ] Deficiencies documented and corrected

**Why it matters:** 23% of LOTO-related fatalities involve procedures that were "on the books" but not followed or outdated.

---

## Section 3: Fall Protection (OSHA 1926 Subpart M)

### 8. Elevated Work Plans for Overhead Cable Tray

**Standard:** OSHA 29 CFR 1926.502

**Verify:**
- [ ] Fall protection required at 6 feet in construction
- [ ] Overhead cable tray work has specific fall protection plan
- [ ] Personal fall arrest systems (PFAS) installed and inspected
- [ ] Anchor points rated for 5,000 lbs per worker or engineered system
- [ ] Rescue plan documented and equipment staged

**Why it matters:** Data centers feature extensive overhead cable tray systems. Falls during cable installation are the second leading cause of DC construction injuries.

---

### 9. Ladder Safety Program

**Standard:** OSHA 29 CFR 1926.1053

**Verify:**
- [ ] Ladder inspection program in place
- [ ] Fiberglass ladders required near electrical equipment
- [ ] A-frame ladders only on level surfaces
- [ ] Extension ladders secured at top and bottom
- [ ] No metal ladders on site (common DC policy)

**Why it matters:** Improper ladder use near energized equipment creates dual shock + fall hazard.

---

### 10. Raised Floor Opening Protection

**Standard:** OSHA 29 CFR 1926.502(i)

**Verify:**
- [ ] All floor openings covered or guarded
- [ ] Covers secured and marked "HOLE" or "COVER"
- [ ] Guardrails on holes >6 feet deep
- [ ] Workers trained on proper tile lifting procedures
- [ ] Tile carts/racks provided (no standing tiles against equipment)

**Why it matters:** Data center raised floor tiles create trip and fall hazards when removed for cable routing.

---

## Section 4: Hot Work Controls

### 11. Hot Work Permit System

**Standard:** OSHA 29 CFR 1926.352, NFPA 51B

**Verify:**
- [ ] Hot work permits required for welding, cutting, brazing
- [ ] Fire watch assigned for duration + 30 minutes after
- [ ] Combustibles cleared or protected within 35 feet
- [ ] Fire extinguisher within 20 feet of hot work
- [ ] Fire detection systems operational or alternative protection provided

**Why it matters:** Data center environments contain significant combustibles (cable insulation, packaging) and the cost of fire damage to IT equipment is catastrophic.

---

### 12. Smoke and Fire Detection During Construction

**Standard:** NFPA 75, NFPA 76

**Verify:**
- [ ] Fire detection systems maintained throughout construction
- [ ] Impairment notification process for system outages
- [ ] Alternative fire watch when systems impaired
- [ ] Suppression systems (if installed) protected from accidental discharge
- [ ] Clean agent suppression room integrity maintained

**Why it matters:** Construction activities frequently impair detection systems. Without alternative protection, fire can spread undetected.

---

## Section 5: Contractor Safety Management

### 13. Contractor Pre-Qualification

**Standard:** Industry best practice

**Verify:**
- [ ] EMR verification (< 1.0 required, < 0.8 preferred)
- [ ] DART rate verification
- [ ] Safety program documentation reviewed
- [ ] OSHA 10/30 hour training verification for workers
- [ ] Electrical workers have NFPA 70E training documentation

**Why it matters:** Subcontractor incidents impact the entire project. Unvetted subs bring 3x the incident rate.

---

### 14. Daily Safety Coordination

**Standard:** OSHA 29 CFR 1926.16

**Verify:**
- [ ] Daily coordination meetings held
- [ ] All contractors represented at meetings
- [ ] Hot work, LOTO, and confined space activities coordinated
- [ ] Work area boundaries clearly defined
- [ ] Conflicting activities identified and deconflicted

**Why it matters:** Data center construction packs multiple trades into confined spaces. Without coordination, trades create hazards for each other.

---

### 15. Multi-Employer Worksite Responsibilities

**Standard:** OSHA Multi-Employer Citation Policy

**Verify:**
- [ ] General contractor (controlling employer) duties documented
- [ ] Subcontractor (creating employer) responsibilities clear
- [ ] Site safety rules communicated to all employers
- [ ] Hazard correction authority and process established
- [ ] Right-to-stop-work authority granted to all employers

**Why it matters:** OSHA can cite multiple employers for a single incident. Clear responsibilities prevent both incidents and citations.

---

## Section 6: Emergency Response

### 16. Emergency Action Plan

**Standard:** OSHA 29 CFR 1926.35

**Verify:**
- [ ] Written emergency action plan for the site
- [ ] Evacuation routes posted and communicated
- [ ] Assembly points established away from electrical equipment
- [ ] Emergency contact numbers posted
- [ ] Plan addresses electrical emergencies specifically

**Why it matters:** Data center emergencies (arc flash, fire) require immediate, coordinated response. Confusion costs lives.

---

### 17. Electrical Rescue Equipment

**Standard:** NFPA 70E Article 110.2

**Verify:**
- [ ] Rescue hooks and blankets staged near high-voltage areas
- [ ] AED devices available within 3-minute response time
- [ ] Personnel trained in electrical rescue (non-contact rescue)
- [ ] Local emergency services briefed on site hazards
- [ ] Medical services identified and route planned

**Why it matters:** Electrical shock victims need immediate rescue and CPR. Untrained rescuers become secondary victims.

---

### 18. Spill Response for Battery Systems

**Standard:** OSHA 29 CFR 1926.441, EPA requirements

**Verify:**
- [ ] Battery room spill containment in place
- [ ] Spill response kits stocked and accessible
- [ ] Workers trained on battery acid/electrolyte hazards
- [ ] Eye wash within 10 seconds of battery areas
- [ ] Ventilation adequate for hydrogen off-gassing

**Why it matters:** Large-format lithium and lead-acid battery systems in data centers create chemical exposure and fire/explosion hazards.

---

## Section 7: Documentation and Verification

### 19. Safety Documentation Currency

**Standard:** Multiple OSHA standards require documentation

**Verify:**
- [ ] Training records current (OSHA 10/30, NFPA 70E, LOTO)
- [ ] Equipment inspection records current (ladders, PPE, fire extinguishers)
- [ ] EEWP and hot work permits filed
- [ ] Incident investigation reports complete
- [ ] Corrective actions tracked to completion

**Why it matters:** Documentation proves compliance. Missing records = citation, regardless of actual practice.

---

### 20. Pre-Energization Safety Verification

**Standard:** NFPA 70E, industry best practice

**Verify:**
- [ ] Visual inspection of all electrical connections
- [ ] Torque verification on critical connections documented
- [ ] IR scanning scheduled for first 30 days post-energization
- [ ] Arc flash labels verified installed
- [ ] Operating procedures reviewed with operations team
- [ ] All workers cleared from energization zone
- [ ] Emergency response team standing by

**Why it matters:** The most dangerous moment in DC construction is initial energization. Systematic verification prevents the incident that delays your project by months.

---

## Summary Score Card

| Section | Points | Your Score |
|---------|--------|------------|
| Electrical Safety (1-4) | 4 | ___ |
| Lockout/Tagout (5-7) | 3 | ___ |
| Fall Protection (8-10) | 3 | ___ |
| Hot Work (11-12) | 2 | ___ |
| Contractor Management (13-15) | 3 | ___ |
| Emergency Response (16-18) | 3 | ___ |
| Documentation (19-20) | 2 | ___ |
| **TOTAL** | **20** | **___** |

**Score Interpretation:**
- **18-20:** Controlled - Your program is industry-leading
- **14-17:** Managed - Solid foundation, address gaps promptly
- **10-13:** Developing - Significant exposure, prioritize improvements
- **Below 10:** Exposed - Immediate intervention required

---

## Next Steps

**Found gaps in your data center safety program?**

Safety Excellence Group provides:
- **Arc Flash Engineering** - Incident energy studies and labeling programs
- **LOTO Program Development** - Equipment-specific procedures for DC environments
- **Contractor Safety Oversight** - Pre-qualification and ongoing monitoring
- **Safety Staffing** - CSP and CHST certified professionals for DC construction

**Book a 15-minute discovery call:**
Your custom proposal delivered within 48 hours.

[Contact Safety Excellence Group](https://safety-excellence.com)

---

*Safety Excellence Group | 18+ Years | 50+ Fab Projects | 5 Continents*

*This checklist provides general guidance only. It does not constitute professional safety consulting or site-specific advice. Verify all requirements against applicable local, state, and federal regulations. Consult qualified safety professionals before implementation.*
