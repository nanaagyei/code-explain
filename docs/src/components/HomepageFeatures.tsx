import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: '🤖 AI-Powered Documentation',
    Svg: require('@site/static/img/ai-documentation.svg').default,
    description: (
      <>
        Automatically generate comprehensive documentation for your code using advanced AI models.
        Support for 20+ programming languages with intelligent code analysis.
      </>
    ),
  },
  {
    title: '🔍 Smart Code Review',
    Svg: require('@site/static/img/code-review.svg').default,
    description: (
      <>
        Get detailed security analysis, performance insights, and best practice recommendations.
        Identify vulnerabilities and optimization opportunities automatically.
      </>
    ),
  },
  {
    title: '📊 Quality Metrics',
    Svg: require('@site/static/img/quality-metrics.svg').default,
    description: (
      <>
        Comprehensive 5-dimensional scoring system covering maintainability, testability,
        readability, performance, and security with actionable improvement suggestions.
      </>
    ),
  },
  {
    title: '🏗️ Architecture Diagrams',
    Svg: require('@site/static/img/architecture.svg').default,
    description: (
      <>
        Interactive visualizations of your code structure with relationship mapping,
        multiple layout options, and export capabilities for documentation.
      </>
    ),
  },
  {
    title: '🎓 AI Coding Mentor',
    Svg: require('@site/static/img/mentor.svg').default,
    description: (
      <>
        Personalized skill assessment and learning paths based on your code patterns.
        Get tailored challenges and track your improvement over time.
      </>
    ),
  },
  {
    title: '⚡ Bulk Operations',
    Svg: require('@site/static/img/bulk-operations.svg').default,
    description: (
      <>
        Process multiple repositories simultaneously with batch analysis capabilities.
        GitHub integration, custom AI prompts, and API key management included.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          <div className="col col--12">
            <div className="text--center margin-bottom--lg">
              <h2>Powerful Features for Modern Development</h2>
              <p>
                CodeExplain combines the power of AI with modern web technologies
                to revolutionize how you document, analyze, and improve your code.
              </p>
            </div>
          </div>
        </div>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
