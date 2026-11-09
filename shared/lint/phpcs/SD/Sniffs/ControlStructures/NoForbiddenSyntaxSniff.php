<?php

namespace SD\Sniffs\ControlStructures;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;

class NoForbiddenSyntaxSniff implements Sniff
{
    private const REASONS = [
        T_WHILE => 'while is forbidden, iterate over a collection instead',
        T_DO => 'do-while is forbidden, iterate over a collection instead',
        T_BREAK => 'break is forbidden, extract the condition into a function',
        T_CONTINUE => 'continue is forbidden, use array_filter instead',
    ];

    public function register()
    {
        return array_keys(self::REASONS);
    }

    public function process(File $phpcsFile, $stackPtr)
    {
        $tokens = $phpcsFile->getTokens();
        $reason = self::REASONS[$tokens[$stackPtr]['code']] ?? 'forbidden syntax';

        $phpcsFile->addError('%s', $stackPtr, 'Forbidden', [$reason]);
    }
}
