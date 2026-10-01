import { useState } from 'react';
import { introPages, MAX_NAME_LENGTH } from '@/content';
import { fillFromState, monthlyInterest } from '@/engine';
import { Panel } from '../components/Panel';
import { formatMoney, formatPercent } from '../format';
import { useGame } from '../GameContext';

export function IntroScreen() {
  const { state, dispatch } = useGame();
  const [pageIndex, setPageIndex] = useState(0);
  const [name, setName] = useState('');

  const lastIndex = introPages.length - 1;
  const page = introPages[Math.min(pageIndex, lastIndex)]!;
  const isLast = pageIndex >= lastIndex;

  const sign = () => dispatch({ type: 'BEGIN_GAME', name });

  return (
    <Panel
      title={page.title}
      actions={
        !isLast && (
          <button type="button" className="button--quiet" onClick={() => setPageIndex(lastIndex)}>
            Skip intro
          </button>
        )
      }
    >
      <p className="muted intro__counter">
        {pageIndex + 1} / {introPages.length}
      </p>
      {page.paragraphs.map((paragraph, index) => (
        <p key={index} className="prose intro__paragraph">
          {fillFromState(state, paragraph)}
        </p>
      ))}

      {isLast && (
        <form
          className="intro__form"
          onSubmit={(submit) => {
            submit.preventDefault();
            sign();
          }}
        >
          <dl className="facts">
            <dt>Vessel</dt>
            <dd>{state.ship.name}</dd>
            <dt>Principal</dt>
            <dd>{formatMoney(state.loan.principal)}</dd>
            <dt>Interest</dt>
            <dd>
              {formatPercent(state.loan.monthlyInterestRate, 1)} per month (
              {formatMoney(monthlyInterest(state.loan))} to start)
            </dd>
            <dt>Monthly draft</dt>
            <dd>{formatMoney(state.loan.monthlyPayment)}, on the first</dd>
            <dt>Starting funds</dt>
            <dd>{formatMoney(state.money)}</dd>
          </dl>
          <label className="intro__name">
            Your name
            <input
              type="text"
              autoComplete="off"
              maxLength={MAX_NAME_LENGTH}
              placeholder={state.player.name}
              value={name}
              onChange={(change) => setName(change.target.value)}
            />
          </label>
          <button type="submit" className="button--primary">
            Sign for the {state.ship.name}
          </button>
        </form>
      )}

      <div className="intro__nav">
        <button
          type="button"
          disabled={pageIndex === 0}
          onClick={() => setPageIndex((index) => Math.max(0, index - 1))}
        >
          Back
        </button>
        {!isLast && (
          <button
            type="button"
            className="button--primary"
            onClick={() => setPageIndex((index) => Math.min(lastIndex, index + 1))}
          >
            Next
          </button>
        )}
      </div>
    </Panel>
  );
}
