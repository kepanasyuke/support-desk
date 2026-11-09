<?php

namespace SD\Sniffs\Functions;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;

class MaxStatementsSniff implements Sniff
{
    public $max = 2;

    public function register()
    {
        return [T_FUNCTION, T_CLOSURE, T_FN];
    }

    public function process(File $phpcsFile, $stackPtr)
    {
        $tokens = $phpcsFile->getTokens();
        $opener = $tokens[$stackPtr]['scope_opener'] ?? null;
        $closer = $tokens[$stackPtr]['scope_closer'] ?? null;

        $this->check($phpcsFile, $stackPtr, $opener, $closer);
    }

    private function check(File $phpcsFile, int $stackPtr, $opener, $closer)
    {
        $hasScope = $opener !== null && $closer !== null;

        $hasScope
            ? $this->measure($phpcsFile, $stackPtr, $opener, $closer)
            : null;
    }

    private function measure(File $phpcsFile, int $stackPtr, int $opener, int $closer)
    {
        $tokens = $phpcsFile->getTokens();
        $count = 0;
        $index = $opener + 1;

        while ($index < $closer) {
            $index = $this->advance($tokens, $index, $count);
        }

        $this->report($phpcsFile, $stackPtr, $count);
    }

    private function advance(array $tokens, int $index, int &$count)
    {
        $token = $tokens[$index];
        $isNested = $this->isNestedFunction($token);
        $nestedEnd = $isNested ? ($token['scope_closer'] ?? $index) : $index;
        $isStatement = $token['code'] === T_SEMICOLON;

        $count = $isStatement ? $count + 1 : $count;

        return $isNested ? $nestedEnd + 1 : $index + 1;
    }

    private function isNestedFunction(array $token)
    {
        $codes = [T_FUNCTION, T_CLOSURE, T_FN];

        return in_array($token['code'], $codes, true) && isset($token['scope_closer']);
    }

    private function report(File $phpcsFile, int $stackPtr, int $count)
    {
        $isTooLong = $count > (int) $this->max;

        if ($isTooLong) {
            $phpcsFile->addError(
                'Function has %d statements, limit is %d',
                $stackPtr,
                'TooLong',
                [$count, (int) $this->max]
            );
        }
    }
}
