import React from 'react';
import AnnexureHeader from './AnnexureHeader';
import './InspectionTestPlanAnnexure.css';

/**
 * InspectionTestPlanAnnexure - Complete 8-page Inspection & Test Plan
 * Combines all pages into a single continuous document
 * Pages 1-8 of 18 total pages
 */
const InspectionTestPlanAnnexure = ({ data = {}, selectedCall }) => {
  return (
    <div className="inspection-test-plan-annexure">
      
      {/* ========================================
          PAGE 1 - Sampling Plan & General Info
          ======================================== */}
      <div className="itp-page page-1">
        <AnnexureHeader
          selectedCall={selectedCall}
          pageNo="1 of 18"
          preparedBy="KJM"
          checkedBy="CSR"
          approvedBy="GM(I)/WR"
        />

        <div className="itp-content">
          {/* Case/Book/Set Numbers */}
          <div className="itp-info-row">
            <div className="itp-info-item">
              <span className="itp-label">Case No.:</span>
              <span className="itp-value">{data.caseNo || ''}</span>
            </div>
            <div className="itp-info-item">
              <span className="itp-label">Book No.:</span>
              <span className="itp-value">{data.bookNo || ''}</span>
            </div>
            <div className="itp-info-item">
              <span className="itp-label">Set No.:</span>
              <span className="itp-value">{data.setNo || ''}</span>
            </div>
          </div>

          {/* Specification List */}
          <div className="itp-section">
            <div className="itp-numbered-item">
              <span className="itp-number">1.</span>
              <span className="itp-label">Specification /Drawing :</span>
              <span className="itp-text">RDSO Drg. No. T-3701 ALT-7 & T-3919 Alt-2 & IRS/T-31-2025 (Sixth Revision)</span>
            </div>
            <div className="itp-numbered-item">
              <span className="itp-number">2.</span>
              <span className="itp-label">Date of Inspection</span>
              <span className="itp-colon">:</span>
              <span className="itp-value">{data.inspectionDate || ''}</span>
            </div>
            <div className="itp-numbered-item">
              <span className="itp-number">3.</span>
              <span className="itp-label">Place of Inspection</span>
              <span className="itp-colon">:</span>
              <span className="itp-value">{data.inspectionPlace || ''}</span>
            </div>
            <div className="itp-numbered-item">
              <span className="itp-number">4.</span>
              <span className="itp-label">Size of lot</span>
              <span className="itp-colon">:</span>
              <span className="itp-value">{data.lotSize || ''}</span>
            </div>
            <div className="itp-numbered-item">
              <span className="itp-number">5.</span>
              <span className="itp-label">Size of Sample</span>
              <span className="itp-colon">:</span>
              <span className="itp-value">{data.sampleSize || ''}</span>
            </div>
          </div>

          {/* Sampling Notes */}
          <div className="itp-note-section">
            <p className="itp-note-text">
              (i) For raw material: As per Cl. No. 4.11.2 of IRS/T-31-2025
            </p>
            <p className="itp-note-text">
              02 samples per heat for chemical & physical properties mentioned at Sr. no. (a), (b), (c), (d),
              (e), (f), (g) & (h) at 'A' below and 20 samples per heat for dimensional check (Rod Dia).
            </p>
            <p className="itp-note-text">
              (ii) For End product (Clip): As per Cl. No. 6 of IRS/T-31-2025 Clips manufactured from same
              heat & heat treated in similar manner will form one lot. Sampling plan as below:
            </p>
            <p className="itp-note-text itp-note-italic">
              (As per Cl. 6.2 of IRS/T-31-2025 refer Table-1 of the latest spec IS: 2500 pt-1/2000)
            </p>
          </div>

          {/* Sampling Plan Table Header */}
          <div className="itp-table-title">
            DOUBLE SAMPLING AQL PLANS FOR NORMAL INSPECTION GENERAL INSPECTION LEVEL-II
          </div>
          <div className="itp-table-subtitle">Annexure-V</div>

          {/* Sampling Plan Table */}
          <table className="itp-table sampling-table">
            <thead>
              <tr>
                <th rowSpan="2">Lot Size</th>
                <th rowSpan="2">Sample Code Letter</th>
                <th rowSpan="2">Sample</th>
                <th colSpan="4">Accepted quality level percent, defectives = 2.5 (For dimension and weight)</th>
                <th colSpan="4">Accepted quality level percent, defectives = 1.5 (For Hardness and Toe load)</th>
              </tr>
              <tr>
                <th>Sample Size</th>
                <th>Cumul. sample no</th>
                <th>Acc. no</th>
                <th>Rej. No.</th>
                <th>Acc. no</th>
                <th>Rej. No.</th>
                <th colSpan="2">Rej. No.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>151-280</td>
                <td>G</td>
                <td>First<br/>Second</td>
                <td>20<br/>20</td>
                <td>20<br/>40</td>
                <td>0<br/>3</td>
                <td>3<br/>4</td>
                <td>0<br/>1</td>
                <td>2<br/>2</td>
                <td rowSpan="7" colSpan="2">If only one clip fails in the first sample, the second sample of clips shall be tested. In case that the sample size is twice the sample size of the first sample. All the clips in the lot or sample of clips should be tested and shall be accepted if the clips should pass the test for acceptance of the lot, i.e., in case one clip fails the lot will be rejected.</td>
              </tr>
              <tr>
                <td>281-500</td>
                <td>H</td>
                <td>First<br/>Second</td>
                <td>32<br/>32</td>
                <td>32<br/>64</td>
                <td>1<br/>4</td>
                <td>3<br/>5</td>
                <td>0<br/>3</td>
                <td>3<br/>4</td>
              </tr>
              <tr>
                <td>501-1200</td>
                <td>J</td>
                <td>First<br/>Second</td>
                <td>50<br/>50</td>
                <td>50<br/>100</td>
                <td>2<br/>6</td>
                <td>5<br/>7</td>
                <td>1<br/>4</td>
                <td>3<br/>5</td>
              </tr>
              <tr>
                <td>1201-3200</td>
                <td>K</td>
                <td>First<br/>Second</td>
                <td>80<br/>80</td>
                <td>80<br/>160</td>
                <td>3<br/>9</td>
                <td>6<br/>10</td>
                <td>2<br/>6</td>
                <td>5<br/>7</td>
              </tr>
              <tr>
                <td>3201-10,000</td>
                <td>L</td>
                <td>First<br/>Second</td>
                <td>125<br/>125</td>
                <td>125<br/>250</td>
                <td>5<br/>12</td>
                <td>9<br/>13</td>
                <td>3<br/>9</td>
                <td>6<br/>10</td>
              </tr>
              <tr>
                <td>10,001 - 35,000</td>
                <td>M</td>
                <td>First<br/>Second</td>
                <td>200<br/>200</td>
                <td>200<br/>400</td>
                <td>7<br/>18</td>
                <td>11<br/>19</td>
                <td>5<br/>12</td>
                <td>9<br/>13</td>
              </tr>
              <tr>
                <td>35,001- 1,50,000</td>
                <td>N</td>
                <td>First<br/>Second</td>
                <td>315<br/>315</td>
                <td>315<br/>630</td>
                <td>11<br/>26</td>
                <td>16<br/>27</td>
                <td>#<br/>18</td>
                <td>11<br/>19</td>
              </tr>
            </tbody>
          </table>

          {/* Notes Section */}
          <div className="itp-notes-section">
            <div className="itp-notes-title">Notes:</div>
            <div className="itp-note-item">
              <span className="itp-note-number">i.</span>
              <span className="itp-note-content">
                Notes: In the first sample, if the numbers of failed pieces are equal to the acceptance
                number (a), the lot shall be accepted. If, the number of failed pieces in equal to or more
                than the number given under column ®, the lot shall be rejected.
              </span>
            </div>
            <div className="itp-note-item">
              <span className="itp-note-number">ii.</span>
              <span className="itp-note-content">
                If the numbers exceed the acceptance number (a) but is less than the number given
                under column ®, the second sample should be considered.
              </span>
            </div>
            <div className="itp-note-item">
              <span className="itp-note-number">iii.</span>
              <span className="itp-note-content">
                If the cumulative failed pieces equal or exceed the rejection number ®, the lot shall be
                rejected. The cumulative failed pieces are the total number of failed pieces in the first
                and second samples.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          PAGE 2 - Tests & Specifications
          ======================================== */}
      <div className="itp-page page-2">
        <AnnexureHeader
          selectedCall={selectedCall}
          pageNo="2 of 18"
          preparedBy="KJM"
          checkedBy="CSR"
          approvedBy="GM(I)/WR"
        />

        <div className="itp-content">
          {/* Continuation Note */}
          <div className="itp-numbered-item">
            <span className="itp-number">iv.</span>
            <span className="itp-text">
              The cut bars shall be subjected to 100% crack detection by Magnetic Particle Crack
              Detector Machine as per IS 3703:2004 before using them into production to ensure that
              the cut bars are free from harmful defects. (Ref. Cl. No. 6.2.1)
            </span>
          </div>

          {/* Test Parameters Table Title */}
          <div className="itp-section-title">
            TOE LOAD, TOE DEFLECTION, WEIGHT & FLAT BEARING CONTACT LENGTH OF<br/>
            ANTI-CREEP ELASTIC RAIL CLIPS
          </div>
          <div className="itp-section-subtitle">Annexure-V</div>

          {/* Test Parameters Table */}
          <table className="itp-table test-params-table">
            <thead>
              <tr>
                <th rowSpan="2">Drawing No.</th>
                <th rowSpan="2">Type of clip</th>
                <th rowSpan="2">Nominal tolerances as per clause 6.2</th>
                <th rowSpan="2">Dia. (mm) Weight of clip (g)</th>
                <th rowSpan="2">Tolerance in weight (g)</th>
                <th rowSpan="2">Toe deflection (mm)</th>
                <th rowSpan="2">Toe load range (kg) clause 7.8 / 6.2</th>
                <th colSpan="2">Contact of surface flat toe clips clause</th>
              </tr>
              <tr>
                <th>Major axis (mm) Min.</th>
                <th>Minor axis (mm) Min.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>2</td>
                <td>3</td>
                <td>4</td>
                <td></td>
                <td>5</td>
                <td>6</td>
                <td></td>
                <td>9</td>
              </tr>
              <tr>
                <td>RDSO/T-3701</td>
                <td>ERC Mk-III</td>
                <td>20.64</td>
                <td>920</td>
                <td>+17 / -16</td>
                <td>13.5</td>
                <td>850-1100</td>
                <td>26</td>
                <td>8</td>
              </tr>
              <tr>
                <td>RDSO/T-3919</td>
                <td>ERC Mk-V</td>
                <td>23.00 and 20.64 for central portion</td>
                <td>1088</td>
                <td>+20 / -20</td>
                <td>13.5</td>
                <td>1200-1500</td>
                <td>26</td>
                <td>8</td>
              </tr>
            </tbody>
          </table>

          {/* Other Tests Table */}
          <div className="itp-subsection-title">Other Tests:</div>
          <table className="itp-table other-tests-table">
            <thead>
              <tr>
                <th>Lot size</th>
                <th>Chemical Analysis Sample size</th>
                <th>Inclusion rating</th>
                <th>Fatigue test (If required)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Per Heat/Lot</td>
                <td>1 No.</td>
                <td>6 Nos. minimum</td>
                <td>4 Nos.</td>
              </tr>
            </tbody>
          </table>

          {/* Document Check Section */}
          <div className="itp-numbered-item">
            <span className="itp-number">6.</span>
            <span className="itp-label">Document Check</span>
          </div>

          <div className="itp-checklist">
            <div className="itp-checklist-item">
              <span className="itp-checklist-letter">a.</span>
              <span className="itp-checklist-text">RDSO approval & its validity</span>
            </div>
            <div className="itp-checklist-item">
              <span className="itp-checklist-letter">b.</span>
              <span className="itp-checklist-text">
                Raw material test certificate bearing heat no. & grade,
                color code, chemical analysis, inclusion rating, grain size,
                of decarburization, hardness, weight of consignment,
                reduction ratio & steel making process as per requirement
                of cl. 4.2 & 4.11.1 Spec. IRS/T-31-2025
              </span>
            </div>
            <div className="itp-checklist-item">
              <span className="itp-checklist-letter">c.</span>
              <span className="itp-checklist-text">
                Internal dimensional check/test record as per Cl.8. of
                IRS/T-31-2025
              </span>
            </div>
            <div className="itp-checklist-item">
              <span className="itp-checklist-letter">d.</span>
              <span className="itp-checklist-text">
                Spring Steel Round should be as rolled and straighten for
                hot forming of grade 55Si7 of IS-3195 from RDSO
                Approved source (Ref. Cl. No. 3).
              </span>
            </div>
            <div className="itp-checklist-item">
              <span className="itp-checklist-letter">e.</span>
              <span className="itp-checklist-text">
                Spring Steel Round purchased by vendors for
                manufacture of ERC shall be traceable to billets
                procurement (Ref. Cl. No. 4.2).
              </span>
            </div>
            <div className="itp-checklist-item">
              <span className="itp-checklist-letter">f.</span>
              <span className="itp-checklist-text">
                Calibration record of gauges, measuring instruments &
                test equipment.
              </span>
            </div>
            <div className="itp-checklist-item">
              <span className="itp-checklist-letter">g.</span>
              <span className="itp-checklist-text">
                RDSO approved gauges as per RDSO / T-3746 alt-4 for
                MK-III & T-5920 alt-4 for MK-V.
              </span>
            </div>
            <div className="itp-checklist-item">
              <span className="itp-checklist-letter">h.</span>
              <span className="itp-checklist-text">Packing List.</span>
            </div>
            <div className="itp-checklist-item">
              <span className="itp-checklist-letter">i.</span>
              <span className="itp-checklist-text">
                Raw material & the finished product must be checked, as
                per laid down norms.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          PAGE 3 - Raw Material Tests (Part A)
          ======================================== */}
      <div className="itp-page page-3">
        <AnnexureHeader
          selectedCall={selectedCall}
          pageNo="3 of 18"
          preparedBy="KJM"
          checkedBy="CSR"
          approvedBy="GM(I)/WR"
        />

        <div className="itp-content">
          {/* Section Title */}
          <div className="itp-numbered-item">
            <span className="itp-number">7.</span>
            <span className="itp-label">Tests/Checks (to be witnessed by inspector)</span>
          </div>
          <div className="itp-section-heading">A-- Raw Material (Spring Steel Round):</div>

          {/* Raw Material Tests Table */}
          <table className="itp-table raw-material-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Parameter</th>
                <th >Value Specified</th>
                <th>Observation</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>(a)</td>
                <td>Visual/Free dom from defects</td>
                <td>
                  Surface of the as rolled bars shall be reasonably smooth, free from distortion, twist & kinks and shall be substantially straight.
                  <br/><br/>
                  The bars shall be free from harmful defects namely folds, laps, cracks, deep pits, grooves, seams or scaling which may lead to cracking during hardening or impair serviceability.
                </td>
                <td></td>
                <td>Ref. Cl. No. 4.8 of IRS/T-31-2025<br/>(Two samples per heat)</td>
              </tr>
              <tr>
                <td rowSpan="2">(b)</td>
                <td rowSpan="2">Chemical analysis</td>
                <td>
                  Bars shall be free from internal defects such as piping, segregation which may impair serviceability.
                  <br/><br/>
                  As per IS 3195 (Reaffirmed 2017) Gr. 55Si7
                </td>
                <td></td>
                <td rowSpan="2">Ref. Cl. No. 4.3.1 & Cl. 4.3.2 of IRS/T-31-2025<br/><br/>(Two samples per heat)<br/><br/>Test Method: Spectrographically<br/><br/>Ref. Cl. No. 4.5 of IRS/T-31-2025</td>
              </tr>
              <tr>
                <td>
                  <table className="itp-nested-table">
                    <thead>
                      <tr>
                        <th colSpan="2">Ladle Analysis</th>
                        <th colSpan="2">Product Analysis (Permissible range over ladle sample analysis)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>% C</td>
                        <td>0.5 – 0.6</td>
                        <td>% C</td>
                        <td>± 0.03</td>
                      </tr>
                      <tr>
                        <td>% Mn</td>
                        <td>0.8 – 1.0</td>
                        <td>% Mn</td>
                        <td>± 0.04</td>
                      </tr>
                      <tr>
                        <td>% Si</td>
                        <td>1.5 – 2.0</td>
                        <td>% Si</td>
                        <td>± 0.05</td>
                      </tr>
                      <tr>
                        <td>% S</td>
                        <td>0.03 max</td>
                        <td>% S</td>
                        <td>– 0.005</td>
                      </tr>
                      <tr>
                        <td>% P</td>
                        <td>0.03 max</td>
                        <td>% P</td>
                        <td>– 0.005</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                <td></td>
              </tr>
              <tr>
                <td>(c)</td>
                <td>Inclusion rating</td>
                <td>Shall not be worse than 2.0 at A, B, C, D both for thick & thin series.</td>
                <td></td>
                <td>(Two samples per heat)<br/>Test method:<br/>IS 4163-2004<br/>(Re-affirmed 2017)<br/>Ref. Cl. No. 4.4 of IRS/T-31-2025</td>
              </tr>
              <tr>
                <td>(d)</td>
                <td>Grain size</td>
                <td>Grain size of as rolled bars shall be 6 or finer</td>
                <td></td>
                <td>(Two samples per heat)<br/>Test Method:<br/>IS 4748:2009<br/>(Re-affirmed 2017)</td>
              </tr>
              <tr>
                <td>(e)</td>
                <td>Depth of decarburiza tion</td>
                <td>Average total depth of decarburization (partial+ complete) tested with magnification of 100X at five deepest decarburized zones shall not be more than 0.15mm.</td>
                <td></td>
                <td>Ref. Cl. No. 4.7 of IRS/T-31-2025<br/>(Two samples per heat)<br/>Test method:<br/>IS: 6396-2000<br/>(Re-affirmed 2018)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================
          PAGE 4 - Raw Material Tests (Part A Continued)
          ======================================== */}
      <div className="itp-page page-4">
        <AnnexureHeader
          selectedCall={selectedCall}
          pageNo="4 of 18"
          preparedBy="KJM"
          checkedBy="CSR"
          approvedBy="GM(I)/WR"
        />

        <div className="itp-content">
          {/* Continuation of Raw Material Tests Table */}
          <table className="itp-table raw-material-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Parameter</th>
                <th>Value Specified</th>
                <th>Observation</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>(f)</td>
                <td>Section/Dia</td>
                <td>
                  Section of as rolled bars shall be as per order. The tolerance on the diameter of as rolled bars for 20.64mm & 23mm is as under
                  <br/>For dia. 20.64 mm: -0.17 mm, +0.20 mm
                  <br/>For dia. 23 mm: -0.19 mm, +0.23 mm
                  <br/>The measurement of diameter shall be carried out with the help of Vernier Calipers with digital display.
                </td>
                <td></td>
                <td>Ref. Cl. No. 4.9 of IRS/T-31-2025<br/><br/>(20 samples per heat)</td>
              </tr>
              <tr>
                <td>(g)</td>
                <td>Hardness</td>
                <td>
                  The hardness of as rolled bars when tested in accordance with IS: 1500-2005, the average of three readings shall be approximately 270 HBW or its equivalent in HRC or HV scales. This value is for general guidance only.
                </td>
                <td></td>
                <td>Ref. Cl. No. 4.6 of IRS/T-31-2025 (Two samples per heat)<br/>Test method:<br/>IS: 1500-2005.<br/>(Re-affirmed 2007)<br/>(Re-affirmed 2010)</td>
              </tr>
              <tr>
                <td rowSpan="2">(h)</td>
                <td rowSpan="2">Marking</td>
                <td>
                  The bars supplied shall be distinctly marked with paint at the extreme ends with different colours to be related with the heat number of materials by which steel may be traced to the cast from which it has been made. The bars of different heats shall not be mixed up in the same bundle and the bars of each heat shall be stored in stacks heat wise.
                </td>
                <td></td>
                <td rowSpan="2">Ref. Cl. No. 4.10 of IRS/T-31-2025</td>
              </tr>
              <tr>
                <td>
                  The bars should be supplied in bundles tied with binding wires and with packing strips (18-33mm width) at minimum three locations having manufacturer's seal/ name/logo/code. In addition, a metal tag shall also be provided with each bundle bearing the details of the firm (code, name etc.) PO No., Heat No. date, grade, size, and length.
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>

          {/* Signature Line */}
          <div className="itp-signature-line">
            Name & signature of IE
          </div>
        </div>
      </div>

      {/* ========================================
          PAGE 5 - Finished Product Tests (Part B)
          ======================================== */}
      <div className="itp-page page-5">
        <AnnexureHeader
          selectedCall={selectedCall}
          pageNo="5 of 18"
          preparedBy="KJM"
          checkedBy="CSR"
          approvedBy="GM(I)/WR"
        />

        <div className="itp-content">
          {/* Section Title */}
          <div className="itp-section-heading">B - Finished Product: (Elastic Rail Clip)</div>

          {/* Finished Product Tests Table */}
          <table className="itp-table finished-product-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Parameter</th>
                <th>Value Specified</th>
                <th>Observation</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowSpan="2">(a)</td>
                <td rowSpan="2">Visual/Free dom from defects</td>
                <td>
                  Clips shall be free from harmful surface defects such as seams, laps, rough or jagged and imperfect edges.
                  <br/><br/>
                  The heterogeneity of steel and freedom from internal defects to be examined by micro-etching process.
                  <br/><br/>
                  Sampling of clips and acceptance/rejection of the lot for freedom from defects will be as per 7.3.2 and 7.3.3
                </td>
                <td></td>
                <td rowSpan="2">Ref. Cl. No. 7.4 of IRS/T-31-2025<br/><br/>Test method:<br/>micro-etching:<br/>IS:7739 (part-5)<br/>(Re-affirmed 2018)</td>
              </tr>
              <tr>
                <td>
                  As per inspection gauges:
                  <br/>Drg No. RDSO/T-3746 Alt-4 for MK-III ERC,
                  <br/>Drg. No. RDSO/T-5920 Alt-2 for MK-V ERC
                </td>
                <td></td>
              </tr>
              <tr>
                <td>(b)</td>
                <td>Dimensional</td>
                <td>
                  7.6.1 The sample clips shall be checked for the dimensions by means of inspection gauges as per RDSO drawings, and shall meet the requirement of dimensions and tolerances as provided in the drawings of Inspection gauges. The diameter of front arch position of ERC shall be checked by Vernier caliper showing digital display, in two perpendicular directions of the ERC at front arch and at average value shall not be less than 20.4 /mm for ERC Mk-III & ERC-J and 20.81 for ERC Mk-V 7.6.2
                </td>
                <td></td>
                <td>Ref. Cl. No. 7.6 of IRS/T-31-2025<br/><br/>Should be checked after the material found suitable in application & deflection test.</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td>
                  The sample clips shall also be examined for the flat bearing lengths of the major & minor axis of toe of the clip with the rail flange in the rail fastening assembly. For this purpose, the major and minor axis of the elliptical contact surface shall be measured to meet the requirements given in Annexure-V. For ensuring that the flat toe bearing area of the toe of the clip with rail flange slope surface at the major and minor axis, a filler 0.05mm thick shall not pass under the toe of clip along the major and minor axis of the clip. In case of ERC-I, the clips shall be examined in a similar way as indicated above, but for the bearing length of the toe on rail seat which shall be between 10-15 mm.
                </td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================
          PAGE 6 - Finished Product Tests (Part B Continued)
          ======================================== */}
      <div className="itp-page page-6">
        <AnnexureHeader
          selectedCall={selectedCall}
          pageNo="6 of 18"
          preparedBy="KJM"
          checkedBy="CSR"
          approvedBy="GM(I)/WR"
        />

        <div className="itp-content">
          {/* Continuation of Finished Product Tests Table */}
          <table className="itp-table finished-product-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Parameter</th>
                <th>Value Specified</th>
                <th>Observation</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowSpan="2">(c)</td>
                <td rowSpan="2">Chemical composition</td>
                <td>
                  <table className="itp-nested-table">
                    <thead>
                      <tr>
                        <th colSpan="2">Ladle Analysis</th>
                        <th colSpan="2">Product Analysis (Permissible range over ladle sample analysis)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>% C</td>
                        <td>0.5 – 0.6</td>
                        <td>% C</td>
                        <td>± 0.03</td>
                      </tr>
                      <tr>
                        <td>% Mn</td>
                        <td>0.8 – 1.0</td>
                        <td>% Mn</td>
                        <td>± 0.04</td>
                      </tr>
                      <tr>
                        <td>% Si</td>
                        <td>1.5 – 2.0</td>
                        <td>% Si</td>
                        <td>± 0.05</td>
                      </tr>
                      <tr>
                        <td>% S</td>
                        <td>0.03 max</td>
                        <td>% S</td>
                        <td>– 0.005</td>
                      </tr>
                      <tr>
                        <td>% P</td>
                        <td>0.03 max</td>
                        <td>% P</td>
                        <td>– 0.005</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                <td></td>
                <td rowSpan="2">Ref. Cl. No. 7.1 with 4.3.1 & Cl. 4.3.2 of IRS/T-31-2025<br/><br/>(One sample per Lot)<br/><br/>Test Method: Spectrographically<br/><br/>Ref. Cl. No. 7.2 of IRS/T-31-2025</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>(d)</td>
                <td>Hardness</td>
                <td>
                  <table className="itp-nested-table">
                    <thead>
                      <tr>
                        <th>Hardness HRC</th>
                        <th>Hardness Number 40 – 44</th>
                      </tr>
                    </thead>
                  </table>
                </td>
                <td></td>
                <td>Test Method: IS:1586 Pt.2 for RC</td>
              </tr>
              <tr>
                <td>(e)</td>
                <td>Depth of decarburizat ion Test</td>
                <td>
                  Average total depth of decarburization (partial+ complete) tested with magnification of 100X at five deepest decarburized zones shall not be more than d/10 or 0.25 mm whichever is less for acceptance of material (where, d=bar dia.)
                </td>
                <td></td>
                <td>Ref. Cl. No. 7.3 of IRS/T-31-2025<br/><br/>Test method: IS: 6396-2000</td>
              </tr>
              <tr>
                <td>(g)</td>
                <td>Microstruct ure</td>
                <td>
                  Sample of clip shall be properly examined for microstructure. Sample prepared for micro examination shall be etched with 2% nital. Microstructure of the clip should reveal tempered martensite structure across the section excluding the decarburized layer at 500X /1000X magnification.
                </td>
                <td></td>
                <td>Ref. Cl. No. 7.4.3 of IRS/T-31-2025</td>
              </tr>
              <tr>
                <td>(g)</td>
                <td>Inclusion Rating</td>
                <td>Shall not be worse than 2.0 at A,B,C,D both for thick & thin series.</td>
                <td></td>
                <td>Ref. Cl. No. 7.5 of IRS/T-31-2025<br/><br/>Test method: IS 4163-2004</td>
              </tr>
              <tr>
                <td>(h)</td>
                <td>Application & Deflection</td>
                <td>
                  The sample clips shall be tested by driving into a fixture i.e.(Application Deflection Block as per RDSO drawing of the relevant clip.) through horizontal pushing by Hydraulic or Power Press or using any suitable arrangement, which deflects the clip to the same extent as in the rail fastening assembly. The clips shall then be removed from the fixture and this process is to be repeated successively thrice. On 3rd drive clips to be checked for flat bearing length as per clause 7.6.2 and for Toe Load as per clause 7.8.
                </td>
                <td></td>
                <td>Ref. Cl. No. 7.7 of IRS/T-31-2025</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================
          PAGE 7 - Finished Product Tests (Part B Continued)
          ======================================== */}
      <div className="itp-page page-7">
        <AnnexureHeader
          selectedCall={selectedCall}
          pageNo="7 of 18"
          preparedBy="KJM"
          checkedBy="CSR"
          approvedBy="GM(I)/WR"
        />

        <div className="itp-content">
          {/* Continuation of Finished Product Tests Table */}
          <table className="itp-table finished-product-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Parameter</th>
                <th>Value Specified</th>
                <th>Observation</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>i)</td>
                <td>Toe Load</td>
                <td>
                  At Toe Deflection of 13.5mm:
                  <br/><br/>
                  850 -1100 Kgs for ERC MK-III.
                  <br/>1200 -1500 Kgs for ERC MK-V.
                </td>
                <td></td>
                <td>Ref. Cl. No. 7.8 & Annexure-V of IRS/T-31-2025</td>
              </tr>
              <tr>
                <td>j)</td>
                <td>Weight Test</td>
                <td>
                  The sample clips shall be checked for the weight by means of digital weighing machine and shall meet with requirement of weight as given in Annexure-V.
                  <br/><br/>
                  Weight Test shall be carried out lot wise & as per Table 1 of IS:2500 Part 1-2000
                </td>
                <td></td>
                <td>Ref. Cl. No. 7.11 & Annexure-V of IRS/T-31-2025 & Record to be maintained as per annexure XV IRS/T-31-2025</td>
              </tr>
              <tr>
                <td>k)</td>
                <td>Fatigue Test</td>
                <td>
                  This test shall be carried out in case of complaint/ reference from the user or any similar potent reason (on need basis only) as decided by RDSO at the cost of firm.
                  <br/><br/>
                  Fatigue testing shall be done in RDSO or Government laboratory or from lab accredited by Accreditation agency as per extant guideline issued by RDSO or National Test House or Regional Test Center (RTC), as per fatigue scheme enclosed as Annexure XII.
                </td>
                <td></td>
                <td>Ref. Cl. No. 7.9 of IRS/T-31-2025</td>
              </tr>
              <tr>
                <td>l)</td>
                <td>Stress Test:</td>
                <td>
                  This test shall be carried out at RDSO, only at the time of type approval of firm in the category of Developmental Vendors. Out of eight samples, four sample clips having higher toe load shall be tested for stress test as per test scheme enclosed as Annexure - XIV. The value of the stress in the clip shall not be more than 1148 Kg/mm2.
                </td>
                <td></td>
                <td>Ref. Cl. No. 7.10 of IRS/T-31-2025</td>
              </tr>
              <tr>
                <td>m)</td>
                <td>Protection</td>
                <td>
                  The clips shall be cleaned off all rust & protected with coating of boiled linseed oil as per IS:77-1976 (RA2019) or any other rust preventing compound approved by the purchaser.
                </td>
                <td></td>
                <td>Ref. Cl. No. 9.0 of IRS/T-31-2025</td>
              </tr>
              <tr>
                <td>n)</td>
                <td>Packing</td>
                <td>
                  The clips shall be packed in double gunny bags/polythene bags, each bag containing 50 clips. A maximum of 1 bar with less than 50 nos. is allowed in a consignment.
                  <br/><br/>
                  Not more than one gunny bag / polythene bags shall be filled with less than 50 clips which should be clearly mentioned by the manufacturer on the dispatch particulars giving the bag numbers (as painted thereon) and number of clips.
                </td>
                <td></td>
                <td>Ref. Cl. No. 10 of IRS/T-31-2025<br/><br/>Ref: SECR letter No. SECR/HQ/Engg/ CSP/EKB/Imp/2 001 dated 16.05.2018</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================
          PAGE 8 - Marking & Undertaking
          ======================================== */}
      <div className="itp-page page-8">
        <AnnexureHeader
          selectedCall={selectedCall}
          pageNo="8 of 18"
          preparedBy="KJM"
          checkedBy="CSR"
          approvedBy="GM(I)/WR"
        />

        <div className="itp-content">
          {/* Continuation of Finished Product Tests Table */}
          <table className="itp-table finished-product-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Parameter</th>
                <th>Value Specified</th>
                <th>Observation</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowSpan="2"></td>
                <td rowSpan="2"></td>
                <td>
                  The packing shall be sound to ensure that there is no loss or damage to the clips during transits. The gunny bags / polythene bags should not have any exterior stitching whatsoever, except for the edge to be sealed.
                  <br/><br/>
                  The hessian thread used for stitching the gunny bag / polythene bag edge should be free from any knots except at the sealing point.
                  <br/><br/>
                  <strong>Used empty cements bags/ bags with inappropriate marking not to be used for packing</strong>
                </td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>
                  All clips shall bear clear inscription of stamp at the heel of the clip to indicate:
                  <br/><br/>
                  Manufacturer's name
                  <br/>Last one digit of the year of manufacture
                  <br/>Lot No. of the year.
                </td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>o)</td>
                <td>Marking</td>
                <td></td>
                <td></td>
                <td>Ref. Cl. No. 5.4 of IRS/T-31-2025</td>
              </tr>
            </tbody>
          </table>

          {/* Undertaking Section */}
          <div className="itp-undertaking-section">
            <div className="itp-undertaking-title">Undertaking</div>
            <div className="itp-undertaking-item">
              a) I have understood all the applicable Specifications, Drawings, PO, Q&P Check Sheets etc. and no further clarification/modification is required in this regard.
            </div>
            <div className="itp-undertaking-item">
              b) I have understood all the tests (including their test methods) to be conducted during this inspection.
            </div>
            <div className="itp-undertaking-item">
              c) Minimum total inspection visits required in this inspection are _____________ (to be filled by IE)
            </div>
            <div className="itp-undertaking-item">
              d) I have ensured minimum total inspection visits & minimum total time required for this inspection
            </div>
            <div className="itp-signature-line">
              Name & signature of IE
            </div>
          </div>

          {/* Notes Section */}
          <div className="itp-footer-notes">
            <div className="itp-footer-note">
              <strong>Note:</strong>
            </div>
            <div className="itp-footer-note-item">
              i. Sampling shall be done according to IS 2500 - 2000 Pt-1 single sampling plan (normal) unless mentioned otherwise.
            </div>
            <div className="itp-footer-note-item">
              ii. In case a quality plan is mentioned in the Purchase Order, the Inspecting Engineer will also take into consideration the inspection and mention the same in Inspection Records.
            </div>
            <div className="itp-footer-note-item">
              iii. In case purchase order mentions different drawing/specification, then that will be applicable.
            </div>
            <div className="itp-footer-note-item">
              iv. If actual sample size of the product don't permit cutting of the required test parameter like (hardness/chemical/decarb/inclusion/microstructure etc.) then the nearest specified test parameter like specified parameters which is/are feasible (in terms of size/shape of sample piece/test specimen intended for respective tests) and the same shall be mentioned in Inspection Records/Report.
            </div>
            <div className="itp-footer-note">
              <strong>Important:</strong>
            </div>
            <div className="itp-footer-note-item">
              1. Do not check original PO (Either in physical form or online)
            </div>
            <div className="itp-footer-note-item">
              2. Cross check Inspection Plan/one time than the office of inspection mentioned in PO
            </div>
            <div className="itp-footer-note-item">
              3. Do not undertake inspection if the quantity offered is less than the quantity mentioned in the call letter.
            </div>
            <div className="itp-footer-note-item">
              4. Do not accept samples provided in PO or authorized by client.
            </div>
            <div className="itp-footer-note-item">
              5. Do not accept samples offered on after drawing samples for lab/in-house testing and before leaving the site.
            </div>
            <div className="itp-footer-note-item">
              6. Use check-sheets for recording observations.
            </div>
            <div className="itp-footer-note-item">
              7. In case of any discrepancy in PO/Drawing/Drawing/Q&P/Technical Spec annexed with PO, the same shall be brought into the notice of vendor as well as CM for seeking necessary clarification from Purchaser/Client.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default InspectionTestPlanAnnexure;
