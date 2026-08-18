Program JOGO_DAS_PORTAS;
uses crt;

VAR 
  opSorteada, palpite, contador: integer;
  res00, res01, res10, res11: integer;
  opcaoMenu: char;
  nomeOperacao: string;                                     

Begin
  REPEAT { LOOP PRINCIPAL }
    
    RANDOMIZE;
    opSorteada := RANDOM(6) + 1;
     
    { 
      Calcula os 4 casos possíveis (A=0/B=0, A=0/B=1, A=1/B=0, A=1/B=1) 
      para a operação sorteada
    }
    IF (opSorteada = 1) THEN { AND }
    BEGIN
      res00 := 0; res01 := 0; res10 := 0; res11 := 1;
      nomeOperacao := 'AND';
    END
    ELSE IF (opSorteada = 2) THEN { OR }
    BEGIN
      res00 := 0; res01 := 1; res10 := 1; res11 := 1;
      nomeOperacao := 'OR';
    END
    ELSE IF (opSorteada = 3) THEN { XOR }
    BEGIN
      res00 := 0; res01 := 1; res10 := 1; res11 := 0;
      nomeOperacao := 'XOR';
    END
    ELSE IF (opSorteada = 4) THEN { NOT A }
    BEGIN
      res00 := 1; res01 := 1; res10 := 0; res11 := 0;
      nomeOperacao := 'NOT';
    END
    ELSE IF (opSorteada = 5) THEN { NAND }
    BEGIN
      res00 := 1; res01 := 1; res10 := 1; res11 := 0;
      nomeOperacao := 'NAND';
    END
    ELSE IF (opSorteada = 6) THEN { NOR }
    BEGIN
      res00 := 1; res01 := 0; res10 := 0; res11 := 0;
      nomeOperacao := 'NOR';
    END;

    REPEAT { LOOP DE VALIDAÇÃO: Garante escolha de 1 a 6 }
      CLRSCR; 

      WRITELN('===================================================');
      WRITELN('          O MISTÉRIO DAS PORTAS MÁGICAS');                                                                  
      WRITELN('===================================================');
      WRITELN('');
     
      WRITELN('Você encontrou o Portal Sagrado!');
      WRITELN('O portal emite diferentes sinais dependendo dos Artefatos:');
      WRITELN('');
      
      { EXIBIÇÃO DA TABELA DE CASOS }
      WRITELN('      +------------+------------+---------------+');
      WRITELN('      | Artefato A | Artefato B | Sinal Gerado  |');
      WRITELN('      +------------+------------+---------------+');
      WRITELN('      |     0      |     0      |       ', res00, '       |');
      WRITELN('      |     0      |     1      |       ', res01, '       |');
      WRITELN('      |     1      |     0      |       ', res10, '       |');
      WRITELN('      |     1      |     1      |       ', res11, '       |');
      WRITELN('      +------------+------------+---------------+');
      WRITELN('');
     
      WRITELN('Análise o padrão da tabela e descubra qual MAGIA LÓGICA');
      WRITELN('está controlando o Portal Sagrado!');    
      WRITELN('');
      WRITELN('Escolha a Magia Lógica correspondente:');
      WRITELN('');          
      WRITELN('          [1] AND  (E)');
      WRITELN('          [2] OR   (OU)');
      WRITELN('          [3] XOR  (OU Exclusivo)');  
      WRITELN('          [4] NOT  (Inversor do Artefato A)');
      WRITELN('          [5] NAND (NÃO E)');
      WRITELN('          [6] NOR  (NÃO OU)');
      WRITELN('');
     
      WRITE('Qual é a sua escolha (1-6)? ');
      READLN(palpite);
     
      IF (palpite < 1) OR (palpite > 6) THEN
      BEGIN
        WRITE('NÚMERO INVÁLIDO! DIGITE DE 1 A 6');
        FOR contador := 1 TO 3 DO
        BEGIN
          DELAY(1000);
          WRITE('.');
        END;
      END;

    UNTIL (palpite >= 1) AND (palpite <= 6);     

    { Exibe o resultado direto na mesma tela, sem limpar }
    WRITELN('');
    IF (palpite = opSorteada) THEN
    BEGIN
      WRITELN('===================================================');
      WRITELN('       PARABÉNS! VOCÊ DESVENDOU A MAGIA!');
      WRITELN('===================================================');
      WRITELN('Excelente análise! A porta lógica era realmente: ', nomeOperacao);
    END
    ELSE
    BEGIN
      WRITELN('===================================================');
      WRITELN('       ERROU! O SELO MÁGICO TE REPELIU!');
      WRITELN('===================================================');
      WRITELN('A operação correta para essa tabela era: ', nomeOperacao);
    END;
     
    WRITELN('');
    
    { MENU DE REPETIÇÃO DO JOGO }
    REPEAT
      WRITE('Deseja jogar novamente? (S - Sim / N - Não): ');
      READLN(opcaoMenu);
      opcaoMenu := UpCase(opcaoMenu);

      IF (opcaoMenu <> 'S') AND (opcaoMenu <> 'N') THEN
      BEGIN
        WRITELN('Opção inválida! Digite apenas S ou N.');
        DELAY(1200);
      END;

    UNTIL (opcaoMenu = 'S') OR (opcaoMenu = 'N');

  UNTIL (opcaoMenu = 'N');

  CLRSCR;
  WRITELN('Obrigado por jogar O MISTÉRIO DAS PORTAS MÁGICAS!');
  DELAY(1500);
End.