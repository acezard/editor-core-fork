import React from 'react';
import { EventHandler, MouseEvent, KeyboardEvent } from 'react';
import PropTypes from 'prop-types';
import { Card as SmartCard } from '@atlaskit/smart-card';
import {
  ProviderFactory,
  UnsupportedInline,
  ZERO_WIDTH_SPACE,
} from '@atlaskit/editor-common';
import { findOverflowScrollParent } from '@atlaskit/editor-common';
import rafSchedule from 'raf-schd';

import { SmartCardProps, Card } from './genericCard';
import { ReactComponentProps } from '../../../nodeviews';
import ReactNodeView from '../../../nodeviews/ReactNodeView';
import { registerCard } from '../pm-plugins/actions';

export interface InlineCardNodeViewProps extends ReactComponentProps {
  providerFactory?: ProviderFactory;
}

export class InlineCardComponent extends React.PureComponent<SmartCardProps> {
  private scrollContainer?: HTMLElement;
  private onClick: EventHandler<MouseEvent | KeyboardEvent> = () => {};

  static contextTypes = {
    contextAdapter: PropTypes.object,
  };

  UNSAFE_componentWillMount() {
    const { view } = this.props;
    const scrollContainer = findOverflowScrollParent(view.dom as HTMLElement);
    this.scrollContainer = scrollContainer || undefined;
  }

  onResolve = (data: { url?: string; title?: string }) => {
    const { getPos, view } = this.props;
    if (!getPos || typeof getPos === 'boolean') {
      return;
    }

    const { title, url } = data;

    // don't dispatch immediately since we might be in the middle of
    // rendering a nodeview
    rafSchedule(() =>
      view.dispatch(
        registerCard({
          title,
          url,
          pos: getPos(),
        })(view.state.tr),
      ),
    )();
  };

  render() {
    const { node, cardContext } = this.props;
    const { url, data } = node.attrs;
    const card = (
      <span>
        <span>{ZERO_WIDTH_SPACE}</span>
        <span className="card">
          <SmartCard
            key={url}
            url={url}
            data={data}
            appearance="inline"
            onClick={this.onClick}
            container={this.scrollContainer}
            onResolve={this.onResolve}
          />
        </span>
      </span>
    );
    // [WS-2307]: we only render card wrapped into a Provider when the value is ready,
    // otherwise if we got data, we can render the card directly since it doesn't need the Provider
    return cardContext && cardContext.value ? (
      <cardContext.Provider value={cardContext.value}>
        {card}
      </cardContext.Provider>
    ) : data ? (
      card
    ) : null;
  }
}

const WrappedInlineCard = Card(InlineCardComponent, UnsupportedInline);

export class InlineCard extends ReactNodeView {
  render() {
    return (
      <WrappedInlineCard
        node={this.node}
        view={this.view}
        getPos={this.getPos}
      />
    );
  }
}
