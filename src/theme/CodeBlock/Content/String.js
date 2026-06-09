/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Swizzled to enable word wrap by default. The built-in word-wrap toggle
 * button stays fully functional — users can still turn wrapping off per
 * block. We just flip its initial state to "on" once on mount so long
 * commands wrap instead of overflowing horizontally.
 */
import React, {useEffect} from 'react';
import {useThemeConfig} from '@docusaurus/theme-common';
import {
  CodeBlockContextProvider,
  createCodeBlockMetadata,
  useCodeWordWrap,
} from '@docusaurus/theme-common/internal';
import CodeBlockLayout from '@theme/CodeBlock/Layout';
function useCodeBlockMetadata(props) {
  const {prism} = useThemeConfig();
  return createCodeBlockMetadata({
    code: props.children,
    className: props.className,
    metastring: props.metastring,
    magicComments: prism.magicComments,
    defaultLanguage: prism.defaultLanguage,
    language: props.language,
    title: props.title,
    showLineNumbers: props.showLineNumbers,
  });
}
// TODO Docusaurus v4: move this component at the root?
export default function CodeBlockString(props) {
  const metadata = useCodeBlockMetadata(props);
  const wordWrap = useCodeWordWrap();
  // Enable word wrap by default. Child effects run before this one, so the
  // Layout has mounted and attached codeBlockRef by now — toggle() can find
  // the <code> element. Empty deps means this runs once, on mount.
  useEffect(() => {
    if (wordWrap.codeBlockRef.current && !wordWrap.isEnabled) {
      wordWrap.toggle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <CodeBlockContextProvider metadata={metadata} wordWrap={wordWrap}>
      <CodeBlockLayout />
    </CodeBlockContextProvider>
  );
}
