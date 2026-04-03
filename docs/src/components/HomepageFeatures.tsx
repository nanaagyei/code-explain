import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: 'AI-Powered Documentation',
    Svg: require('@site/static/img/ai-documentation.svg').default,
    description: (
      <>
        Automatically generate comprehensive documentation for your code using advanced AI models.
        Deep support for Python, JavaScript, TypeScript, Go, Rust, Java, and C/C++.
      </>
    ),
  },
  {
    title: 'Smart Code Review',
    Svg: require('@site/static/img/code-review.svg').default,
    description: (
      <>
        Get detailed security analysis, performance insights, and best practice recommendations.
        Identify vulnerabilities and optimization opportunities automatically.
      </>
    ),
  },
  {
    title: 'Health Score',
    Svg: require('@site/static/img/quality-metrics.svg').default,
    description: (
      <>
        Single headline score with a detailed breakdown across maintainability, testability,
        readability, performance, and security.
      </>
    ),
  },
  {
    title: 'Architecture Diagrams',
    Svg: require('@site/static/img/architecture.svg').default,
    description: (
      <>
        Interactive visualizations of your code structure with relationship mapping,
        multiple layout options, and export capabilities for documentation.
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
