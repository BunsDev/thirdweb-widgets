import {
  Button,
  ButtonGroup,
  Flex,
  Heading,
  Icon,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useClipboard,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useAddress, useDisconnect, useToken } from "@thirdweb-dev/react";
import { ethers } from "ethers";
import React from "react";
import { IoCopy, IoWalletOutline } from "react-icons/io5";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { useQuery } from "react-query";
import { useAccount } from "wagmi";
import { isAddressZero } from "./tokenHooks";

interface ConnectedWalletProps {
  tokenAddress?: string;
}

function shortenAddress(str: string) {
  return `${str.substring(0, 6)}...${str.substring(str.length - 4)}`;
}

export const ConnectedWallet: React.FC<ConnectedWalletProps> = ({
  tokenAddress,
}) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: false });
  const [{ data }] = useAccount();
  const address = useAddress();
  const disconnect = useDisconnect();
  const { onCopy } = useClipboard(address || "");
  const token = useToken(tokenAddress);

  const { data: balance } = useQuery(
    ["balance", address, tokenAddress],
    async () => {
      if (!tokenAddress || !address) {
        return;
      }

      const otherAddressZero = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
      if (
        isAddressZero(tokenAddress) ||
        tokenAddress.toLowerCase() === otherAddressZero.toLowerCase()
      ) {
        return null;
      }

      return await token?.balanceOf(address);
    },
    {
      enabled: !!address && !!token,
    },
  );

  const switchWallet = async () => {
    const provider = data?.connector?.getProvider();
    if (!provider?.isMetaMask || !provider.request) {
      return;
    }

    await provider.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });

    onClose();
  };

  const disconnectWallet = () => {
    disconnect();
    onClose();
  };

  const copyAddress = () => {
    onCopy();
    toast({
      title: "Address copied to clipboard",
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Flex align="center" gap={2}>
      {address && (
        <>
          <Button
            variant="outline"
            size="sm"
            color="gray.800"
            leftIcon={
              <Icon as={IoWalletOutline} color="gray.500" boxSize={4} />
            }
            onClick={onOpen}
          >
            {shortenAddress(address)}
          </Button>
          {balance && (
            <Stack
              direction="row"
              display={{ base: "none", md: "flex" }}
              height="32px"
              px="10px"
              borderRadius="md"
              borderColor="gray.200"
              borderWidth="1px"
              align="center"
            >
              <Icon as={RiMoneyDollarCircleLine} boxSize={4} color="gray.500" />
              <Text fontSize="sm" fontWeight="semibold" whiteSpace="nowrap">
                {ethers.utils.formatUnits(
                  balance.value,
                  balance.decimals || 18,
                )}{" "}
                {balance.symbol}
              </Text>
            </Stack>
          )}
        </>
      )}

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent pb={4} bg="gray.50">
          <ModalCloseButton />

          <ModalHeader>
            <Heading size="label.lg">Account Details</Heading>
          </ModalHeader>

          <ModalBody>
            <Flex direction="column" gap={5}>
              <Stack>
                <Text size="label.md" display={{ base: "flex", md: "none" }}>
                  Connected Wallet
                </Text>
                <ButtonGroup isAttached>
                  <IconButton
                    onClick={copyAddress}
                    mr="-px"
                    borderRight="none"
                    aria-label="Add to friends"
                    variant="outline"
                    size="sm"
                    icon={<Icon as={IoCopy} />}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    width="120px"
                    onClick={copyAddress}
                  >
                    {shortenAddress(address || "")}
                  </Button>
                  {data?.connector?.getProvider()?.isMetaMask && (
                    <Button size="sm" onClick={switchWallet}>
                      Switch
                    </Button>
                  )}
                  <Button
                    onClick={disconnectWallet}
                    colorScheme="red"
                    size="sm"
                  >
                    Disconnect
                  </Button>
                </ButtonGroup>
              </Stack>

              {balance && (
                <Stack display={{ base: "flex", md: "none" }}>
                  <Text size="label.md">Balance</Text>
                  <Flex>
                    <Flex
                      direction="row"
                      height="32px"
                      px="10px"
                      borderRadius="md"
                      borderColor="gray.200"
                      borderWidth="1px"
                      align="center"
                      gap={1}
                    >
                      <Icon
                        as={RiMoneyDollarCircleLine}
                        boxSize={4}
                        color="gray.500"
                      />
                      <Text fontSize="sm" fontWeight="semibold">
                        {ethers.utils.formatUnits(
                          balance.value,
                          balance.decimals || 18,
                        )}{" "}
                        {balance.symbol}
                      </Text>
                    </Flex>
                  </Flex>
                </Stack>
              )}
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
};
