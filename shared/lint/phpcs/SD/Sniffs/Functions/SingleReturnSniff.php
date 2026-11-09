<?php

namespace SD\Sniffs\Functions;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;

class SingleReturnSniff implements Sniff
{
    public function register()
    {
        return [T_FUNCTION, T_CLOSURE, T_FN];
    }

    public function process(File $phpcsFile, $stackPtr)
    {
        $tokens = $phpcsFile->getTokens();
        $opener = $tokens[$stackPtr]['scope_opener'] ?? null;
        $closer = $tokens[$stackPtr]['scope_closer'] ?? null;
        $hasScope = $opener !== null && $closer !== null;

        if ($hasScope) {
            $count = $this->countReturns($tokens, $opener, $closer);
            $this->reportCount($phpcsFile, $stackPtr, $count);
        }
    }

    private function countReturns(array $tokens, int $opener, int $closer)
    {
        $count = 0;
        $index = $opener + 1;

        while ($index < $closer) {
            $index = $this->advance($tokens, $index, $closer, $count);
        }

        return $count;
    }

    private function advance(array $tokens, int $index, int $closer, int &$count)
    {
        $token = $tokens[$index];
        $isNested = $this->isNestedFunction($token);
        $nestedEnd = $isNested ? ($token['scope_closer'] ?? $index) : $index;
        $isReturn = $token['code'] === T_RETURN;

        $count = $isReturn ? $count + 1 : $count;

        return $isNested ? $nestedEnd + 1 : $index + 1;
    }

    private function isNestedFunction(array $token)
    {
        $codes = [T_FUNCTION, T_CLOSURE, T_FN];

        return in_array($token['code'], $codes, true) && isset($token['scope_closer']);
    }

    private function reportCount(File $phpcsFile, int $stackPtr, int $count)
    {
        $isMultiple = $count > 1;

        if ($isMultiple) {
            $phpcsFile->addError(
                'Function has %d return statements, at most one is allowed',
                $stackPtr,
                'MultipleReturns',
                [$count]
            );
        }
    }
}
