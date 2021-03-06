import React from 'react';
import Avatar from '@atlaskit/avatar';
import { gridSize } from '@atlaskit/theme/constants';

import { FormatOptionLabelMeta } from '@atlaskit/select';
import { Option } from '@atlaskit/editor-common/extensions';

import styled from 'styled-components';

const ItemWrapper = styled.div`
  display: flex;
  align-items: center;

  small {
    margin: 0;
    display: block;
  }
`;

const getIconSize = (context: 'menu' | 'value', description?: string) => {
  if (context === 'value' || !description) {
    return 'xsmall';
  }

  return 'small';
};

export const formatOptionLabel = (
  { label, icon, description }: Option,
  { context }: FormatOptionLabelMeta<Option>,
) => {
  return (
    <ItemWrapper>
      {typeof icon === 'string' ? (
        <Avatar
          src={icon}
          size={getIconSize(context, description)}
          appearance="square"
        />
      ) : (
        icon
      )}
      <div style={{ paddingLeft: icon ? gridSize() : 0 }}>
        <p>
          {label}
          {description && context !== 'value' && <small>{description}</small>}
        </p>
      </div>
    </ItemWrapper>
  );
};
