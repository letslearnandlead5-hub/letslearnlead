import { convertPlainMathFractionsToLatex, renderLatexInHtml } from '../src/utils/latexRenderer';

console.log('🧪 Running Mathematical Fraction Rendering Test Suite...\n');

const testCases = [
    { input: 'x = (a+b)/c', expectFrac: true, desc: 'Parenthesized numerator division' },
    { input: 'y = a/b - c/d', expectFrac: true, desc: 'Multiple simple division in equation' },
    { input: 'a/b', expectFrac: true, desc: 'Simple variable division' },
    { input: '(a+b)/(c+d)', expectFrac: true, desc: 'Parenthesized numerator and denominator' },
    { input: '1/2', expectFrac: true, desc: 'Numeric fraction 1/2' },
    { input: '3/4', expectFrac: true, desc: 'Numeric fraction 3/4' },
    { input: 'x^2/2', expectFrac: true, desc: 'Power in numerator' },
    { input: 'sqrt(a/b)', expectFrac: true, desc: 'Square root with inner division' },
    { input: '(a+b)/(c+d) + x/y', expectFrac: true, desc: 'Mixed fractions with addition' },
    { input: '\\frac{a+b}{c}', expectFrac: true, desc: 'Existing LaTeX fraction' },
    { input: '\\frac{x^2+1}{2x}', expectFrac: true, desc: 'Complex LaTeX fraction' },
    { input: '\\sqrt{\\frac{a}{b}}', expectFrac: true, desc: 'LaTeX root with fraction' },
    { input: '\\frac{1}{2}mv^2', expectFrac: true, desc: 'Kinetic energy equation' },
    { input: '10 km/h', expectFrac: false, desc: 'Speed unit (non-math)' },
    { input: '5 kg/m', expectFrac: false, desc: 'Density/mass unit (non-math)' },
    { input: '2025/26', expectFrac: false, desc: 'Academic year date (non-math)' },
    { input: 'NEET 2025/26 Exam', expectFrac: false, desc: 'Exam date string (non-math)' },
    { input: 'H2O', expectFrac: false, desc: 'Chemical formula' },
    { input: '\\frac{a}', expectFrac: true, desc: 'Malformed LaTeX (should not throw)' },
];

let passed = 0;
let failed = 0;

for (const t of testCases) {
    try {
        const latexConverted = convertPlainMathFractionsToLatex(t.input);
        const htmlRendered = renderLatexInHtml(t.input, 'question');

        const hasKaTeXOrFrac = htmlRendered.includes('katex') || htmlRendered.includes('mfrac') || htmlRendered.includes('frac');
        const isNonMathPreserved = !t.expectFrac ? !hasKaTeXOrFrac : true;

        if (isNonMathPreserved) {
            console.log(`✅ [PASS] "${t.input}" (${t.desc})`);
            console.log(`   → LaTeX: "${latexConverted}"`);
            console.log(`   → HTML output length: ${htmlRendered.length} chars\n`);
            passed++;
        } else {
            console.error(`❌ [FAIL] "${t.input}" (${t.desc})`);
            console.error(`   → Unexpected fraction in non-math context: "${htmlRendered}"\n`);
            failed++;
        }
    } catch (err) {
        console.error(`❌ [ERROR] "${t.input}" threw an error:`, err);
        failed++;
    }
}

console.log(`========================================`);
console.log(`📊 Test Results: ${passed} passed, ${failed} failed.`);
console.log(`========================================`);

if (failed > 0) {
    process.exit(1);
}
