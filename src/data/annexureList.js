import ChemicalAnalysisAnnexureAdvanced from '../components/annexures/ChemicalAnalysisAnnexureAdvanced';
import DimensionAnnexure from '../components/annexures/DimensionAnnexure';
import FinalInspectionAnnexure from '../components/annexures/FinalInspectionAnnexure';
import FinalChemicalAnalysisAnnexure from '../components/annexures/FinalChemicalAnalysisAnnexure';
import InclusionRatingAnnexure from '../components/annexures/InclusionRatingAnnexure';
import HardnessTestAnnexure from '../components/annexures/HardnessTestAnnexure';
import DimensionTestAnnexure from '../components/annexures/DimensionTestAnnexure';
import ApplicationDeflectionAnnexure from '../components/annexures/ApplicationDeflectionAnnexure';
import ToeLoadTestAnnexure from '../components/annexures/ToeLoadTestAnnexure';
import WeightTestAnnexure from '../components/annexures/WeightTestAnnexure';
import InspectionTestPlanAnnexure from '../components/annexures/InspectionTestPlanAnnexure';
import ProcessInspectionAnnexure from '../components/annexures/ProcessInspectionAnnexure';

export const ANNEXURE_LIST = [
  {
    id: 'inspection-test-plan',
    title: 'Inspection & Test Plan',
    subtitle: 'Complete Inspection & Test Plan for Elastic Rail Clip MK-III/MK-V',
    cardTitle: 'Inspection & Test Plan',
    code: 'Pages 1-8 of 18',
    icon: '📑',
    category: 'general',
    component: InspectionTestPlanAnnexure
  },
  {
    id: 'chemical-analysis',
    title: 'Chemical Analysis',
    subtitle: 'Stage Inspection for Raw material - Test Result: Chemical Analysis',
    cardTitle: 'Chemical Analysis',
    code: 'Annexure-I',
    icon: '🧪',
    category: 'chemical',
    component: ChemicalAnalysisAnnexureAdvanced
  },
  {
    id: 'dimensional-check',
    title: 'Dimensional Check',
    subtitle: 'Stage Inspection for Raw material - Test Result: Dimension',
    cardTitle: 'Dimensional Check',
    code: 'Annexure-II',
    icon: '📏',
    category: 'dimension',
    component: DimensionAnnexure
  },
  {
    id: 'process-inspection',
    title: 'Process Inspection Register',
    subtitle: 'Elastic Rail Clip Process Inspection Register',
    cardTitle: 'Process Inspection Register',
    code: 'F/ERC-01',
    icon: '⚙️',
    category: 'general',
    orientation: 'portrait',
    component: ProcessInspectionAnnexure
  },
  {
    id: 'final-inspection',
    title: 'Final Inspection Report',
    subtitle: 'Final Inspection Report - Dimensions (in mm)',
    cardTitle: 'Final Inspection Report',
    code: 'Annexure-III',
    icon: '📋',
    category: 'dimension',
    component: FinalInspectionAnnexure
  },
  {
    id: 'final-chemical-analysis',
    title: 'Final Chemical Analysis',
    subtitle: 'Final Inspection Report - Test Result: Chemical Analysis',
    cardTitle: 'Final Chemical Analysis',
    code: 'Annexure-VI',
    icon: '🧪',
    category: 'chemical',
    component: FinalChemicalAnalysisAnnexure
  },
  {
    id: 'inclusion-rating',
    title: 'Inclusion Rating & Depth of Decarb',
    subtitle: 'Final Inspection Report - Test Result: Inclusion Rating, Depth of Decarb',
    cardTitle: 'Inclusion Rating',
    code: 'Annexure-VII',
    icon: '🔬',
    category: 'general',
    component: InclusionRatingAnnexure
  },
  {
    id: 'hardness-test',
    title: 'Hardness Test',
    subtitle: 'Final Inspection Report - Test Result: Hardness Test',
    cardTitle: 'Hardness Test',
    code: 'Annexure-VIII',
    icon: '💎',
    category: 'hardness',
    component: HardnessTestAnnexure
  },
  {
    id: 'dimension-test',
    title: 'Dimension Test',
    subtitle: 'Final Inspection Report - Test Result: Dimension test',
    cardTitle: 'Dimension Test',
    code: 'Annexure-IX',
    icon: '📐',
    category: 'dimension',
    component: DimensionTestAnnexure
  },
  {
    id: 'application-deflection',
    title: 'Application & Deflection Test',
    subtitle: 'Final Inspection Report - Test Result: Application & Deflection test',
    cardTitle: 'App & Deflection',
    code: 'Annexure-X',
    icon: '⚙️',
    category: 'general',
    component: ApplicationDeflectionAnnexure
  },
  {
    id: 'toe-load-test',
    title: 'Toe Load Test',
    subtitle: 'Final Inspection Report - Test Result: Toe load test',
    cardTitle: 'Toe Load Test',
    code: 'Annexure-XI',
    icon: '🔩',
    category: 'general',
    component: ToeLoadTestAnnexure
  },
  {
    id: 'weight-test',
    title: 'Weight Test',
    subtitle: 'Final Inspection Report - Test Result: Weight Test',
    cardTitle: 'Weight Test',
    code: 'Annexure-XV',
    icon: '⚖️',
    category: 'weight',
    component: WeightTestAnnexure
  }
];
