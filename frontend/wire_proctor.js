import fs from 'fs';

const p = 'src/pages/teacher/TeacherDashboard.jsx';
let c = fs.readFileSync(p, 'utf8');

console.log('Includes onResults desktop?', c.includes('navigate(\n                                            `/quiz/${quizId}/results`\n                                        )'));

// Let's replace systematically
c = c.replace(
    `                                    onResults={(quizId) =>
                                        navigate(
                                            \`/quiz/\${quizId}/results\`
                                        )
                                    }`,
    `                                    onResults={(quizId) =>
                                        navigate(
                                            \`/quiz/\${quizId}/results\`
                                        )
                                    }
                                    onLiveProctor={(quizId) =>
                                        navigate(
                                            \`/quiz/\${quizId}/live-proctor\`
                                        )
                                    }`
);

c = c.replace(
    `                            onResults={(quizId) =>
                                navigate(\`/quiz/\${quizId}/results\`)
                            }`,
    `                            onResults={(quizId) =>
                                navigate(\`/quiz/\${quizId}/results\`)
                            }
                            onLiveProctor={(quizId) =>
                                navigate(\`/quiz/\${quizId}/live-proctor\`)
                            }`
);

fs.writeFileSync(p, c, 'utf8');
console.log('Replacement finished!');
