export interface Choice {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly hint?: string;
}

interface ChoiceListProps {
  readonly choices: readonly Choice[];
  readonly onChoose: (id: string) => void;
}

export function ChoiceList({ choices, onChoose }: ChoiceListProps) {
  return (
    <ul className="choices">
      {choices.map((choice) => (
        <li key={choice.id}>
          <button
            type="button"
            className="choice"
            disabled={choice.disabled}
            onClick={() => onChoose(choice.id)}
          >
            <span>{choice.label}</span>
            {choice.hint && <span className="choice__hint">{choice.hint}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
